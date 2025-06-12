import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { fetchIssueById, updateIssueStatus } from '@/lib/notion';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Issue ID missing' });
  }

  try {
    const issue = await fetchIssueById(id as string);

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${issue.title}</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ${issue.content}
          
          <hr style="border: none; height: 1px; background: #eee; margin: 30px 0;">
          
          <h3 style="color: #495057;">本期文章推荐：</h3>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            ${issue.articles.map(a => `
              <p style="margin: 10px 0;">
                <a href="https://velan.zenvel.io/zh/blog/${a.slug}" 
                   style="color: #667eea; text-decoration: none; font-weight: 500;">
                  ${a.title}
                </a>
              </p>
            `).join('')}
          </div>
          
          <hr style="border: none; height: 1px; background: #eee; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #666;">
            感谢您订阅 Velan 通讯！<br>
            如需退订，请点击 
            <a href="https://velan.zenvel.io/unsubscribe" 
               style="color: #667eea; text-decoration: none;">退订链接</a>
          </p>
          
          <p style="font-size: 14px; color: #666; margin-bottom: 0;">
            —— Velan<br>
            <a href="https://velan.zenvel.io" style="color: #667eea; text-decoration: none;">velan.zenvel.io</a>
          </p>
        </div>
      </div>
    `;

    const audienceId = process.env.RESEND_AUDIENCE_ID;
    
    if (!audienceId) {
      return res.status(500).json({ error: 'Audience ID not configured' });
    }

    // 发送邮件到整个 Audience
    await resend.emails.send({
      from: 'Velan <newsletter@mail.zenvel.io>',
      to: audienceId,
      subject: issue.title,
      html,
    });

    // 更新 Notion Status = Sent
    await updateIssueStatus(id as string, 'Sent');
    
    res.json({ ok: true, message: `Newsletter sent to audience: ${audienceId}` });
  } catch (e: any) {
    console.error('Send issue error:', e);
    res.status(500).json({ error: e.message });
  }
} 