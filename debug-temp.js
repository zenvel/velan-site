const { Client } = require('@notionhq/client');
const { marked } = require('marked');
const fs = require('fs');

// 从命令行获取参数
const token = process.argv[2];
const testIssueId = process.argv[3];

if (!token || !testIssueId) {
  console.error('❌ 请提供Notion Token和Newsletter ID作为参数');
  console.error('用法: node debug-temp.js <notion-token> <newsletter-id>');
  process.exit(1);
}

// 创建Notion客户端
const notion = new Client({ 
  auth: token,
  notionVersion: '2022-06-28',
  timeoutMs: 60000,
});

// 获取Newsletter数据
async function fetchIssueById(id) {
  try {
    console.log(`🔍 获取Newsletter Issue (ID: ${id})...`);
    
    const response = await notion.pages.retrieve({ page_id: id });
    const properties = response.properties;
    
    // 输出所有属性名称和类型
    console.log('\n📊 所有属性:');
    Object.keys(properties).forEach(key => {
      const type = properties[key]?.type;
      console.log(`  - ${key} (${type})`);
    });
    
    // 辅助函数
    const getText = (prop) => {
      if (!prop?.rich_text) return '';
      return prop.rich_text.map((text) => text?.plain_text || '').join('');
    };
    
    const getTitle = (prop) => {
      if (!prop?.title) return '';
      return prop.title.map((text) => text?.plain_text || '').join('');
    };
    
    // 增强版getFormula函数
    const getFormula = (prop) => {
      if (!prop || !prop.formula) {
        console.log(`  警告: ${prop ? '公式为空' : '属性不存在'}`);
        return '';
      }
      
      const formulaType = prop.formula.type;
      if (!formulaType) {
        console.log('  警告: 公式类型为空');
        return '';
      }
      
      console.log(`  公式类型: ${formulaType}`);
      
      switch (formulaType) {
        case 'string':
          return prop.formula.string || '';
        case 'number':
          return String(prop.formula.number || '');
        case 'boolean':
          return String(prop.formula.boolean || '');
        case 'date':
          return prop.formula.date?.start || '';
        default:
          console.log(`  警告: 未知的公式类型 ${formulaType}`);
          return '';
      }
    };
    
    // 获取公式字段值
    console.log('\n📝 公式字段值:');
    
    const article1_title = getFormula(properties.article1_title);
    console.log(`  article1_title: "${article1_title}"`);
    
    const article1_summary = getFormula(properties.article1_summary);
    console.log(`  article1_summary: "${article1_summary}"`);
    
    const article1_slug = getFormula(properties.article1_slug);
    console.log(`  article1_slug: "${article1_slug}"`);
    
    const article2_title = getFormula(properties.article2_title);
    console.log(`  article2_title: "${article2_title}"`);
    
    const article2_summary = getFormula(properties.article2_summary);
    console.log(`  article2_summary: "${article2_summary}"`);
    
    const article2_slug = getFormula(properties.article2_slug);
    console.log(`  article2_slug: "${article2_slug}"`);
    
    // 构建issue对象
    const issue = {
      title: getTitle(properties.Title),
      issueNo: properties['Issue No']?.number ?? 1,
      status: properties.Status?.select?.name ?? '',
      contentTpl: getText(properties.Content),
      microLog: getText(properties.micro_log),
      article1: {
        title: article1_title,
        summary: article1_summary,
        slug: article1_slug,
      },
      article2: {
        title: article2_title,
        summary: article2_summary,
        slug: article2_slug,
      },
    };
    
    // 保存原始响应
    fs.writeFileSync('notion-response.json', JSON.stringify(response, null, 2));
    
    return issue;
  } catch (error) {
    console.error('❌ 获取Newsletter失败:', error);
    throw error;
  }
}

// 生成HTML
function generateNewsletterHTML(data) {
  console.log('\n📋 使用的数据:');
  console.log(JSON.stringify(data, null, 2));
  
  // 替换所有占位符
  console.log('\n🔄 替换占位符...');
  let content = data.contentTpl
    .replace(/\{\{issue_no\}\}/g, String(data.issueNo))
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('zh-CN'))
    .replace(/\{\{micro_log\}\}/g, data.microLog || '')
    .replace(/\{\{article1_title\}\}/g, data.article1.title)
    .replace(/\{\{article1_summary\}\}/g, data.article1.summary)
    .replace(/\{\{article1_slug\}\}/g, data.article1.slug)
    .replace(/\{\{article1_link\}\}/g, `https://velan.zenvel.io/zh/blog/${data.article1.slug}`)
    .replace(/\{\{article2_title\}\}/g, data.article2.title)
    .replace(/\{\{article2_summary\}\}/g, data.article2.summary)
    .replace(/\{\{article2_slug\}\}/g, data.article2.slug)
    .replace(/\{\{article2_link\}\}/g, `https://velan.zenvel.io/zh/blog/${data.article2.slug}`);
  
  // 检查替换后的内容
  console.log('\n🔍 检查替换后的内容:');
  console.log(content);
  
  // 转换Markdown为HTML
  console.log('\n🔄 转换Markdown为HTML...');
  const markdownHTML = marked(content);
  
  // 创建美观的邮件模板
  const fullHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
      font-size: 16px;
    }
    .container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      color: #2d3748;
      font-size: 22px;
      margin: 25px 0 15px;
      border-left: 4px solid #667eea;
      padding-left: 15px;
    }
    .content h3 {
      color: #4a5568;
      font-size: 20px;
      margin: 20px 0 10px;
    }
    .content p {
      margin: 14px 0;
      color: #4a5568;
      font-size: 16px;
    }
    .content ul, .content ol {
      margin: 15px 0;
      padding-left: 25px;
    }
    .content li {
      margin: 10px 0;
      color: #4a5568;
      font-size: 16px;
    }
    .content a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
    .content a:hover {
      text-decoration: underline;
    }
    .content hr {
      border: none;
      height: 1px;
      background: linear-gradient(to right, transparent, #e2e8f0, transparent);
      margin: 30px 0;
    }
    .content blockquote {
      border-left: 4px solid #e2e8f0;
      margin: 20px 0;
      padding: 10px 20px;
      background: #f7fafc;
      color: #4a5568;
      font-style: italic;
    }
    .footer {
      background: #f7fafc;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 8px 0;
      font-size: 15px;
      color: #718096;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .unsubscribe {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #a0aec0;
    }
    
    /* 响应式设计 */
    @media (max-width: 600px) {
      body { padding: 10px; font-size: 15px; }
      .header { padding: 30px 20px; }
      .content { padding: 20px; }
      .footer { padding: 20px; }
      .header h1 { font-size: 24px; }
      .content h2 { font-size: 20px; }
      .content h3 { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.title}</h1>
    </div>
    
    <div class="content">
      ${markdownHTML}
    </div>
    
    <div class="footer">
      <p>感谢您订阅 <strong>Velan 通讯</strong></p>
      <p>
        <a href="https://velan.zenvel.io">访问网站</a> · 
        <a href="https://velan.zenvel.io/zh/blog">阅读博客</a>
      </p>
      
      <div class="unsubscribe">
        <p>
          如需退订，请点击 
          <a href="https://velan.zenvel.io/zh/unsubscribe?email={{RESEND_CONTACT_EMAIL}}">退订链接</a>
        </p>
        <p>© ${new Date().getFullYear()} Velan. 用心创作，持续成长。</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
  
  // 保存HTML到文件
  fs.writeFileSync('test-email.html', fullHTML);
  console.log('\n✅ 生成的HTML已保存到test-email.html');
  
  return fullHTML;
}

// 主函数
async function main() {
  try {
    // 获取数据
    const issue = await fetchIssueById(testIssueId);
    
    // 生成HTML
    generateNewsletterHTML(issue);
    
  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

main(); 