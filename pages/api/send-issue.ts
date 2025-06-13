import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { fetchIssueById, updateIssueStatus } from '@/lib/notion';
import { generateNewsletterHTML } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing id' });

  try {
    const issue = await fetchIssueById(id);
    
    // 添加调试信息
    console.log('📊 Issue数据详情:', {
      title: issue.title,
      status: issue.status,
      issueNo: issue.issueNo,
      contentLength: issue.contentTpl?.length,
      microLog: issue.microLog,
      article1: issue.article1,
      article2: issue.article2
    });
    
    // 状态检查
    if (issue.status === 'Sent') {
      return res.status(200).json({ ok: true, message: 'Already sent' });
    }
    
    if (issue.status !== 'Scheduled') {
      return res.status(400).json({ 
        error: `Cannot send newsletter with status '${issue.status}'. Only 'Scheduled' newsletters can be sent.` 
      });
    }

    // 生成美观的HTML邮件模板
    const html = generateNewsletterHTML(issue);
    
    // 记录生成的HTML长度，便于调试
    console.log('📧 生成的HTML长度:', html.length);
    console.log('📧 HTML预览 (前500字符):', html.substring(0, 500));
    
    // 检查文章标题和摘要是否存在于HTML中
    const hasArticle1Title = issue.article1.title && html.includes(issue.article1.title);
    const hasArticle1Summary = issue.article1.summary && html.includes(issue.article1.summary);
    const hasArticle2Title = issue.article2.title && html.includes(issue.article2.title);
    const hasArticle2Summary = issue.article2.summary && html.includes(issue.article2.summary);
    
    console.log('📊 HTML内容检查:');
    console.log('   Article1 Title:', issue.article1.title ? `"${issue.article1.title}"` : '(空)', hasArticle1Title ? '✅' : '❌');
    console.log('   Article1 Summary:', issue.article1.summary ? `"${issue.article1.summary}"` : '(空)', hasArticle1Summary ? '✅' : '❌');
    console.log('   Article2 Title:', issue.article2.title ? `"${issue.article2.title}"` : '(空)', hasArticle2Title ? '✅' : '❌');
    console.log('   Article2 Summary:', issue.article2.summary ? `"${issue.article2.summary}"` : '(空)', hasArticle2Summary ? '✅' : '❌');
    
    if ((!issue.article1.title || !issue.article1.summary || !issue.article2.title || !issue.article2.summary) ||
        (!hasArticle1Title && issue.article1.title) || 
        (!hasArticle1Summary && issue.article1.summary) || 
        (!hasArticle2Title && issue.article2.title) || 
        (!hasArticle2Summary && issue.article2.summary)) {
      console.warn('⚠️ 警告: 部分文章内容为空或未正确渲染到HTML中!');
    }

    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (!audienceId) {
      return res.status(500).json({ error: 'Audience ID not configured' });
    }

    // 使用Broadcast API群发
    // 1. 首先创建broadcast
    const broadcastResponse = await resend.broadcasts.create({
      audienceId: audienceId,
      from: 'Velan <newsletter@mail.zenvel.io>',
      subject: issue.title,
      html,
    });

    // 2. 立即发送broadcast
    if (broadcastResponse.data?.id) {
      await resend.broadcasts.send(broadcastResponse.data.id);
    }

    // 尝试更新状态，如果权限不足则跳过
    try {
      await updateIssueStatus(id, 'Sent');
      res.json({ ok: true, message: 'Newsletter sent and status updated' });
    } catch (statusError: any) {
      console.warn('无法更新状态（权限不足）:', statusError.message);
      res.json({ ok: true, message: 'Newsletter sent successfully (status update failed due to permissions)' });
    }
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
} 