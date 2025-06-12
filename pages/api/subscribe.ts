import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// 简单的内存缓存，用于防止短时间内重复订阅
const recentSubscriptions = new Map<string, number>();
const COOLDOWN_PERIOD = 60 * 1000; // 1分钟冷却期

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email missing' });
  }

  // 检查是否在冷却期内
  const now = Date.now();
  const lastSubscriptionTime = recentSubscriptions.get(email);
  
  if (lastSubscriptionTime && (now - lastSubscriptionTime) < COOLDOWN_PERIOD) {
    return res.status(429).json({ 
      error: '请稍后再试，每分钟只能订阅一次' 
    });
  }

  try {
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    
    if (audienceId) {
      // 添加联系人到 Audience
      try {
        await resend.contacts.create({
          email,
          unsubscribed: false,
          audienceId: audienceId,
        });
        console.log(`联系人 ${email} 已添加到 Audience: ${audienceId}`);
      } catch (contactError: any) {
        // 如果联系人已存在，忽略错误
        if (!contactError.message?.includes('already exists')) {
          console.error('添加联系人到 Audience 失败:', contactError);
        } else {
          console.log(`联系人 ${email} 已存在于 Audience 中`);
        }
      }
    }

    // 发送确认邮件
    await resend.emails.send({
      from: 'Velan <newsletter@mail.zenvel.io>',
      to: email,
      subject: '欢迎订阅 Velan 通讯',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">感谢订阅 Velan 通讯！</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; margin-bottom: 20px;">您好！</p>
            
            <p>您已成功订阅 <strong>Velan 通讯</strong>！</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #495057;">您将收到什么：</h3>
              <ul style="margin-bottom: 0;">
                <li>每月一封精心策划的邮件</li>
                <li>系统构建与产品设计的实用见解</li>
                <li>有意识生活方式的思考与实践</li>
                <li>独家资源和模板分享</li>
              </ul>
            </div>
            
            <p>期待与您在这个数字创作的旅程中相遇！</p>
            
            <hr style="border: none; height: 1px; background: #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">
              如需退订，请回复此邮件或点击 
              <a href="https://velan.zenvel.io/unsubscribe?email=${encodeURIComponent(email)}" 
                 style="color: #667eea; text-decoration: none;">退订链接</a>
            </p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 0;">
              —— Velan<br>
              <a href="https://velan.zenvel.io" style="color: #667eea; text-decoration: none;">velan.zenvel.io</a>
            </p>
          </div>
        </div>
      `
    });
    
    // 记录订阅时间
    recentSubscriptions.set(email, now);
    
    // 清理过期的记录（可选，防止内存泄漏）
    setTimeout(() => {
      if (recentSubscriptions.get(email) === now) {
        recentSubscriptions.delete(email);
      }
    }, COOLDOWN_PERIOD);
    
    res.json({ ok: true });
  } catch (e: any) {
    console.error('Subscription error:', e);
    res.status(500).json({ error: e.message });
  }
} 