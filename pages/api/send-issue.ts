import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { fetchIssueById, updateIssueStatus } from '@/lib/notion';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const issue = await fetchIssueById(id as string);

  const html = `
    <h2>${issue.title}</h2>
    ${issue.content}
    <hr/>
    <p>阅读完整文章: </p>
    ${issue.articles.map(a => `<a href="https://velan.zenvel.io/zh/blog/${a.slug}">${a.title}</a>`).join('<br/>')}
  `;

  await resend.emails.send({
    from: 'Velan <newsletter@mail.zenvel.io>',
    to: 'default',
    subject: issue.title,
    html,
  });

  // 更新 Notion Status = Sent
  await updateIssueStatus(id as string, 'Sent');
  res.json({ ok: true });
} 