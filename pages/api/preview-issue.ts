import { NextApiRequest, NextApiResponse } from 'next';
import { fetchIssueById } from '@/lib/notion';
import { generateNewsletterHTML } from '@/lib/email-template';
import { Client } from '@notionhq/client';

// 创建Notion客户端实例用于调试
const newsletterNotion = new Client({ 
  auth: process.env.NOTION_NEWSLETTER_TOKEN || '',
  notionVersion: '2022-06-28',
  timeoutMs: 60000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, debug } = req.query;
  
  // 添加调试模式，列出所有页面
  if (debug === 'list') {
    try {
      const dbId = process.env.NOTION_NEWSLETTER_DB_ID;
      if (!dbId) {
        return res.status(500).json({ error: 'Newsletter database ID not configured' });
      }
      
      console.log('尝试获取通讯数据库页面列表, 数据库ID:', dbId);
      
      const response = await newsletterNotion.databases.query({
        database_id: dbId,
        page_size: 10,
      });
      
      const pages = response.results.map((page: any) => {
        const properties = page.properties || {};
        const title = properties.Title?.title?.[0]?.plain_text || 'Untitled';
        const status = properties.Status?.select?.name || 'Unknown';
        const issueNo = properties['Issue No']?.number || 0;
        
        return {
          id: page.id,
          title,
          status,
          issueNo,
          createdTime: page.created_time,
          lastEditedTime: page.last_edited_time,
        };
      });
      
      return res.json({ pages });
    } catch (error: any) {
      console.error('获取页面列表失败:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing id' });

  try {
    console.log(`🔍 预览Newsletter (ID: ${id})`);
    
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
    
    const html = generateNewsletterHTML(issue);
    
    // 返回HTML内容，浏览器直接渲染
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e: any) {
    console.error('❌ 预览失败:', e);
    res.status(500).json({ error: e.message });
  }
} 