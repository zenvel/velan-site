import { NextApiRequest, NextApiResponse } from 'next';
import { fetchIssueById } from '@/lib/notion';
import { generateNewsletterHTML } from '@/lib/email-template';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing id' });

  try {
    const issue = await fetchIssueById(id);
    const html = generateNewsletterHTML(issue);
    
    // 返回HTML内容，浏览器直接渲染
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
} 