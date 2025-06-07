# Stagewise 工具栏使用指南

## 简介

Stagewise 是一个浏览器工具栏，可以将前端 UI 连接到代码编辑器中的 AI 代理。它允许开发者在浏览器中选择元素、添加注释，并让 AI 代理基于这些上下文做出更改。

## 安装和设置

### 1. 安装 VS Code 扩展（必需）

Stagewise 需要配合 VS Code 扩展才能工作。请安装 [Stagewise VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=stagewise.stagewise-vscode-extension)。

### 2. 项目配置（已完成）

我们已经在项目中集成了 Stagewise 工具栏，包含以下步骤：

- 安装了 `@stagewise/toolbar-next` 包
- 创建了 `StagewiseProvider` 组件
- 在布局中添加了工具栏
- 配置了连接设置

## 使用方法

1. **启动项目**：使用 `npm run dev` 命令启动项目
2. **确保 VS Code 扩展运行**：打开 VS Code 编辑器并确保 Stagewise 扩展已激活
3. **检查连接状态**：页面右下角会显示 Stagewise 连接状态
4. **使用工具栏**：成功连接后，可以在浏览器中：
   - 选择页面元素
   - 添加注释
   - 让 AI 代理根据注释修改代码

## 故障排除

如果 Stagewise 工具栏显示"连接中"但无法完成连接：

1. **确认 VS Code 扩展**：检查是否已安装并启用 Stagewise VS Code 扩展
2. **单一 VS Code 窗口**：确保只打开一个 VS Code 窗口，多窗口可能导致连接失败
3. **重启服务**：关闭并重启开发服务器和 VS Code
4. **检查控制台**：查看浏览器控制台是否有相关错误信息
5. **配置调整**：如有必要，可以调整 `components/StagewiseProvider.tsx` 中的连接配置

## 参考资源

- [Stagewise 官方文档](https://stagewise.io/docs/)
- [Stagewise VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=stagewise.stagewise-vscode-extension)
- [Stagewise GitHub 仓库](https://github.com/stagewise-io/stagewise) 