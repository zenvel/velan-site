import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';
import { fetchIssueById } from '@/lib/notion';
import { generateNewsletterHTML } from '@/lib/email-template';
import { Resend } from 'resend';

// 创建Notion客户端实例
const newsletterNotion = new Client({ 
  auth: process.env.NOTION_NEWSLETTER_TOKEN || '',
  notionVersion: '2022-06-28',
  timeoutMs: 60000,
});

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证请求来源
    // 1. 检查是否来自Vercel Cron Job
    const isCronJob = req.headers['x-vercel-cron'] === 'true';
    
    // 2. 检查API密钥（用于手动触发或其他系统集成）
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    const configuredApiKey = process.env.API_SECRET_KEY;
    
    // 3. 如果既不是Cron Job也没有有效的API密钥，则拒绝请求
    if (!isCronJob && configuredApiKey && apiKey !== configuredApiKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Step 1: 获取 Newsletter_Issues 表中的最新 Scheduled 项
    const databaseId = process.env.NOTION_NEWSLETTER_DB_ID;
    if (!databaseId) {
      return res.status(500).json({ error: 'Newsletter database ID not configured' });
    }

    console.log('正在查询数据库以获取最新待发送通讯...');
    
    const response = await newsletterNotion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Status",
        select: { equals: "Scheduled" },
      },
      sorts: [
        {
          property: "Date",
          direction: "ascending", // 取最早将要发送的那一期
        },
      ],
      page_size: 1,
    });

    if (!response.results.length) {
      console.log('没有找到待发送的通讯');
      return res.status(404).json({ error: "No scheduled issue found" });
    }

    const latestPage = response.results[0];
    const issueId = latestPage.id;
    
    console.log(`找到待发送通讯，ID: ${issueId}`);

    // Step 2: 获取通讯内容并发送
    await sendIssue(issueId);

    return res.status(200).json({ ok: true, sent_issue_id: issueId });
  } catch (err: any) {
    console.error("发送最新通讯失败:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

async function sendIssue(issueId: string) {
  try {
    console.log(`开始处理通讯 ${issueId} 的发送...`);
    
    // 获取通讯内容
    const issue = await fetchIssueById(issueId);
    
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
      console.log('通讯已经发送过，跳过');
      return;
    }
    
    if (issue.status !== 'Scheduled') {
      console.log(`通讯状态为 ${issue.status}，不是 Scheduled，跳过`);
      return;
    }

    // 生成HTML邮件模板
    const html = generateNewsletterHTML(issue);
    
    // 记录生成的HTML长度，便于调试
    console.log('📧 生成的HTML长度:', html.length);
    
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
      throw new Error('Audience ID not configured');
    }

    console.log('开始发送通讯...');
    
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
      console.log(`通讯广播已创建并发送，ID: ${broadcastResponse.data.id}`);
    } else {
      console.error('创建广播失败:', broadcastResponse.error);
      throw new Error(broadcastResponse.error?.message || 'Failed to create broadcast');
    }

    // 更新通讯状态为已发送
    await updateIssueStatus(issueId);
    console.log('通讯状态已更新为已发送');
    
    return true;
  } catch (error) {
    console.error('发送通讯失败:', error);
    throw error;
  }
}

async function updateIssueStatus(id: string) {
  try {
    await newsletterNotion.pages.update({
      page_id: id,
      properties: {
        Status: {
          select: {
            name: 'Sent'
          }
        }
      }
    });
  } catch (error) {
    console.warn('无法更新通讯状态:', error);
    // 不抛出错误，允许继续执行
  }
} 