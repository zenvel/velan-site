import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email missing' });
  }

  try {
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    
    if (audienceId) {
      // 从 Audience 中移除联系人
      try {
        await resend.contacts.update({
          email,
          unsubscribed: true,
          audienceId: audienceId,
        });
        console.log(`联系人 ${email} 已从 Audience 中退订`);
      } catch (contactError: any) {
        console.error('退订失败:', contactError);
        return res.status(500).json({ error: '退订失败，请稍后重试' });
      }
    }

    // 发送退订确认邮件
    await resend.emails.send({
      from: 'Velan <newsletter@mail.zenvel.io>',
      to: email,
      subject: '退订确认 - Velan 通讯',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: #6c757d; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">退订成功</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; margin-bottom: 20px;">您好！</p>
            
            <p>您已成功从 <strong>Velan 通讯</strong> 退订。</p>
            
            <p>我们很遗憾看到您离开，但完全理解每个人的需求不同。</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;">如果您改变主意，随时欢迎您重新订阅：<br>
              <a href="https://velan.zenvel.io" style="color: #667eea; text-decoration: none;">velan.zenvel.io</a></p>
            </div>
            
            <p>感谢您曾经的关注与支持！</p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 0;">
              —— Velan<br>
              <a href="https://velan.zenvel.io" style="color: #667eea; text-decoration: none;">velan.zenvel.io</a>
            </p>
          </div>
        </div>
      `
    });
    
    res.json({ ok: true });
  } catch (e: any) {
    console.error('Unsubscribe error:', e);
    res.status(500).json({ error: e.message });
  }
} 