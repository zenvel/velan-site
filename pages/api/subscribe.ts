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
    // 发送确认邮件
    await resend.emails.send({
      from: 'Velan <newsletter@mail.zenvel.io>',
      to: email,
      subject: '欢迎订阅 Velan 通讯',
      html: `
        <h2>感谢订阅 Velan 通讯！</h2>
        <p>您已成功订阅我们的月度通讯。</p>
        <p>每月我们会向您发送一封简洁的邮件，分享系统构建与有意识生活方式的内容。</p>
        <br>
        <p>如需退订，请回复此邮件。</p>
        <p>—— Velan</p>
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