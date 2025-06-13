const { Client } = require('@notionhq/client');

// 从命令行获取参数
const token = process.argv[2];
const newsletterId = process.argv[3];

if (!token || !newsletterId) {
  console.error('❌ 请提供Notion Token和Newsletter ID作为参数');
  console.error('用法: node check-relations.js <notion-token> <newsletter-id>');
  process.exit(1);
}

// 创建Notion客户端
const notion = new Client({ 
  auth: token,
  notionVersion: '2022-06-28',
  timeoutMs: 60000,
});

async function checkRelations() {
  try {
    console.log(`🔍 获取Newsletter (ID: ${newsletterId})...`);
    
    // 获取Newsletter页面
    const response = await notion.pages.retrieve({ page_id: newsletterId });
    const properties = response.properties;
    
    // 输出所有属性名称和类型
    console.log('\n📊 所有属性:');
    Object.keys(properties).forEach(key => {
      const type = properties[key]?.type;
      console.log(`  - ${key} (${type})`);
    });
    
    // 查找关联字段
    console.log('\n🔗 关联字段:');
    const relationFields = [];
    
    Object.keys(properties).forEach(key => {
      const prop = properties[key];
      if (prop.type === 'relation') {
        const relations = prop.relation || [];
        console.log(`  - ${key}: ${relations.length} 个关联`);
        
        relations.forEach((rel, idx) => {
          console.log(`    ${idx + 1}. ID: ${rel.id}`);
          relationFields.push({
            fieldName: key,
            relationId: rel.id
          });
        });
      }
    });
    
    // 检查关联的文章
    if (relationFields.length > 0) {
      console.log('\n📄 检查关联的文章:');
      
      for (const relation of relationFields) {
        console.log(`\n🔍 获取关联文章 (字段: ${relation.fieldName}, ID: ${relation.relationId})...`);
        
        try {
          const articleResponse = await notion.pages.retrieve({ page_id: relation.relationId });
          const articleProps = articleResponse.properties;
          
          console.log('  文章属性:');
          Object.keys(articleProps).forEach(key => {
            const type = articleProps[key]?.type;
            let value = '';
            
            if (type === 'title') {
              value = articleProps[key].title.map(t => t.plain_text).join('');
            } else if (type === 'rich_text') {
              value = articleProps[key].rich_text.map(t => t.plain_text).join('');
            } else if (type === 'number') {
              value = articleProps[key].number;
            }
            
            if (value) {
              console.log(`    - ${key} (${type}): ${value}`);
            } else {
              console.log(`    - ${key} (${type})`);
            }
          });
        } catch (error) {
          console.error(`  ❌ 获取关联文章失败:`, error.message);
        }
      }
    }
    
    // 检查公式字段
    console.log('\n📊 公式字段:');
    Object.keys(properties).forEach(key => {
      const prop = properties[key];
      if (prop.type === 'formula') {
        const formulaType = prop.formula.type;
        const value = prop.formula[formulaType];
        
        console.log(`  - ${key}: ${formulaType} = "${value}"`);
      }
    });
    
  } catch (error) {
    console.error('❌ 出错了:', error);
  }
}

checkRelations(); 