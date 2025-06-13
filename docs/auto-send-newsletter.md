# 自动发送通讯指南

本文档介绍如何使用自动发送通讯的API端点和如何设置Vercel定时任务。

## API端点说明

我们创建了一个API端点，用于自动获取最新的待发送通讯并触发发送：

```
GET /api/send-latest-issue
```

这个API端点会执行以下操作：

1. 从Notion数据库中获取状态为"Scheduled"的最早一期通讯
2. 获取通讯内容并生成HTML邮件
3. 使用Resend API发送通讯
4. 更新通讯状态为"Sent"

### 安全性

为了保护API不被未授权访问，你可以在环境变量中设置一个API密钥：

```
API_SECRET_KEY=your_secret_key_here
```

然后在调用API时，可以通过以下两种方式提供密钥：

1. 在请求头中添加`x-api-key`：
```
curl -H "x-api-key: your_secret_key_here" https://your-domain.com/api/send-latest-issue
```

2. 在URL查询参数中添加`api_key`：
```
curl https://your-domain.com/api/send-latest-issue?api_key=your_secret_key_here
```

## 设置Vercel定时任务

Vercel提供了Cron Jobs功能，可以定期触发API端点。以下是设置步骤：

1. 在Vercel项目中，进入"Settings" > "Cron Jobs"
2. 点击"Create Cron Job"
3. 填写以下信息：
   - Name: Send Newsletter
   - Schedule: 根据需要设置，例如`0 9 * * 5`表示每周五上午9点
   - HTTP Method: GET
   - URL Path: `/api/send-latest-issue?api_key=your_secret_key_here`
4. 点击"Create"保存定时任务

### Cron表达式示例

- `0 9 * * 1`: 每周一上午9点
- `0 9 * * 5`: 每周五上午9点
- `0 9 1 * *`: 每月1日上午9点
- `0 9 * * *`: 每天上午9点

## 注意事项

1. 确保环境变量正确设置：
   - `NOTION_NEWSLETTER_TOKEN`: Notion API令牌
   - `NOTION_NEWSLETTER_DB_ID`: 通讯数据库ID
   - `RESEND_API_KEY`: Resend API密钥
   - `RESEND_AUDIENCE_ID`: Resend受众ID
   - `API_SECRET_KEY`: API访问密钥（可选）

2. 确保Notion数据库中有待发送的通讯，状态为"Scheduled"

3. 可以通过手动访问API端点来测试功能：
```
https://your-domain.com/api/send-latest-issue?api_key=your_secret_key_here
```

4. 检查日志以确认发送状态和可能的错误

## 故障排除

如果遇到问题，请检查以下几点：

1. 确保所有环境变量正确设置
2. 检查Notion数据库中是否有状态为"Scheduled"的通讯
3. 检查Vercel日志以获取详细的错误信息
4. 确保Notion集成有权限访问通讯数据库
5. 确保Resend API密钥有效且有权限发送邮件

如需更多帮助，请参考项目文档或联系开发者。 