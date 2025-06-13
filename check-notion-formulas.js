const { Client } = require('@notionhq/client');

// 从命令行获取参数
const token = process.argv[2];
const databaseId = process.argv[3];

if (!token || !databaseId) {
  console.error('❌ 请提供Notion Token和Newsletter数据库ID作为参数');
  console.error('用法: node check-notion-formulas.js <notion-token> <database-id>');
  process.exit(1);
}

// 创建Notion客户端
const notion = new Client({ 
  auth: token,
  notionVersion: '2022-06-28',
  timeoutMs: 60000,
});

async function checkFormulaFields() {
  try {
    console.log(`🔍 获取数据库结构 (ID: ${databaseId})...`);
    
    // 获取数据库结构
    const response = await notion.databases.retrieve({ database_id: databaseId });
    
    console.log('\n📊 数据库属性:');
    const properties = response.properties;
    
    // 查找公式字段
    const formulaFields = [];
    
    Object.keys(properties).forEach(key => {
      const prop = properties[key];
      if (prop.type === 'formula') {
        formulaFields.push({
          name: key,
          formula: prop.formula?.expression || '未知表达式'
        });
      }
    });
    
    if (formulaFields.length === 0) {
      console.log('没有找到公式字段');
      return;
    }
    
    console.log(`\n📝 找到 ${formulaFields.length} 个公式字段:`);
    formulaFields.forEach((field, index) => {
      console.log(`${index + 1}. ${field.name}`);
      console.log(`   表达式: ${field.formula}`);
      console.log('');
    });
    
    // 获取数据库中的记录
    console.log('\n🔍 获取数据库记录...');
    const recordsResponse = await notion.databases.query({
      database_id: databaseId,
      page_size: 1, // 只获取一条记录用于测试
    });
    
    if (!recordsResponse.results || recordsResponse.results.length === 0) {
      console.log('没有找到记录');
      return;
    }
    
    const record = recordsResponse.results[0];
    console.log(`\n📄 测试记录 (ID: ${record.id}):`);
    
    // 检查公式字段的值
    console.log('\n📊 公式字段值:');
    formulaFields.forEach(field => {
      const prop = record.properties[field.name];
      if (!prop) {
        console.log(`  - ${field.name}: ❌ 属性不存在`);
        return;
      }
      
      if (prop.type !== 'formula') {
        console.log(`  - ${field.name}: ❌ 类型不是formula (${prop.type})`);
        return;
      }
      
      const formulaType = prop.formula.type;
      const value = prop.formula[formulaType];
      
      console.log(`  - ${field.name}: ${formulaType} = "${value}"`);
    });
    
    // 检查关联字段
    console.log('\n🔗 检查关联字段:');
    Object.keys(record.properties).forEach(key => {
      const prop = record.properties[key];
      if (prop.type === 'relation') {
        const relations = prop.relation || [];
        console.log(`  - ${key}: ${relations.length} 个关联`);
        relations.forEach((rel, idx) => {
          console.log(`    ${idx + 1}. ID: ${rel.id}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ 出错了:', error);
  }
}

checkFormulaFields(); 