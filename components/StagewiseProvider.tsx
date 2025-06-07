'use client';

import { useEffect, useState } from 'react';
import { StagewiseToolbar } from '@stagewise/toolbar-next';

// Stagewise配置
const stagewiseConfig = {
  plugins: [],
  // 添加 WebSocket 连接配置
  connection: {
    maxRetries: 3,         // 减少重试次数
    retryDelay: 2000,      // 重试间隔时间(毫秒)
    timeout: 20000,        // 增加连接超时时间(毫秒)
    silentErrors: true,    // 静默处理连接错误
    debug: true            // 启用调试模式
  }
};

export default function StagewiseProvider() {
  const [isMounted, setIsMounted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('initializing');
  
  useEffect(() => {
    setIsMounted(true);
    
    // 连接状态变化处理函数
    const handleConnectionChange = (event: any) => {
      setConnectionStatus(event.detail?.status || 'unknown');
      console.log('Stagewise connection status:', event.detail);
    };
    
    // 监听连接状态变化
    window.addEventListener('stagewise:connection-change', handleConnectionChange);
    
    // 清理函数，确保在组件卸载时关闭连接
    return () => {
      window.removeEventListener('stagewise:connection-change', handleConnectionChange);
    };
  }, []);
  
  // 仅在客户端渲染后显示
  if (!isMounted) return null;
  
  // 确保只在开发环境中渲染
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div id="stagewise-container">
      <StagewiseToolbar config={stagewiseConfig} />
      {connectionStatus !== 'connected' && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Stagewise 连接状态: {connectionStatus}</p>
          {connectionStatus !== 'connected' && (
            <p style={{ margin: '4px 0 0 0', color: '#dc3545' }}>
              请确保已安装 <a href="https://marketplace.visualstudio.com/items?itemName=stagewise.stagewise-vscode-extension" target="_blank" rel="noopener noreferrer" style={{ color: '#0d6efd' }}>Stagewise VS Code 插件</a>
            </p>
          )}
        </div>
      )}
    </div>
  );
} 