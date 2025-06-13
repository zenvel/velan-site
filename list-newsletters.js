require('dotenv').config();
const { Client } = require('@notionhq/client');

// 创建Notion客户端
const notion = new Client({ 
  auth: process.env.NOTION_NEWSLETTER_TOKEN || '',
  notionVersion: '2022-06-28',
  timeoutMs: 60000,
});

// 获取Newsletter数据库ID
const NEWSLETTER_DB = process.env.NOTION_NEWSLETTER_DB_ID;

if (!NEWSLETTER_DB) {
  console.error('❌ 请在.env文件中设置NOTION_NEWSLETTER_DB_ID');
  process.exit(1);
}

async function listNewsletters() {
  try {
    console.log(`🔍 获取所有Newsletter...`);
    
    const response = await notion.databases.query({
      database_id: NEWSLETTER_DB,
      sorts: [
        {
          property: 'Issue No',
          direction: 'descending',
        },
      ],
    });
    
    if (!response.results || response.results.length === 0) {
      console.log('没有找到任何Newsletter');
      return;
    }
    
    console.log(`\n📊 找到 ${response.results.length} 个Newsletter:\n`);
    
    response.results.forEach((page, index) => {
      const properties = page.properties;
      const title = properties.Title?.title?.[0]?.plain_text || '无标题';
      const issueNo = properties['Issue No']?.number || '?';
      const status = properties.Status?.select?.name || '未知';
      
      console.log(`${index + 1}. ID: ${page.id}`);
      console.log(`   标题: ${title}`);
      console.log(`   期号: ${issueNo}`);
      console.log(`   状态: ${status}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 出错了:', error);
  }
}

listNewsletters(); 