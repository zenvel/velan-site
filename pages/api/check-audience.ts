import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    
    if (!audienceId) {
      return res.status(500).json({ error: 'RESEND_AUDIENCE_ID 未配置' });
    }

    console.log('🔍 查询 Audience ID:', audienceId);

    // 获取 Audience 联系人
    const contacts = await resend.contacts.list({
      audienceId: audienceId,
    });

    console.log('📊 Audience 联系人数据:', contacts);

    res.json({
      ok: true,
      audienceId: audienceId,
      contacts: contacts,
      count: Array.isArray(contacts.data) ? contacts.data.length : 0
    });
  } catch (e: any) {
    console.error('查询 Audience 出错:', e);
    res.status(500).json({ error: e.message });
  }
} 