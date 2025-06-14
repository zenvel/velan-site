import { NextRequest, NextResponse } from 'next/server';

/**
 * 调试图片API - 用于测试不同方式加载图片
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数中的URL
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url') || 'https://prod-files-secure.s3.us-west-2.amazonaws.com/b3a718e3-dc4f-81c7-a6b0-0003f60466eb/7dfcca44-3331-4cdf-9243-8b17cbff4edb/00e2-2376f4725.jpg';
    
    // 创建HTML页面，测试不同方式加载图片
    const html = `
      <!DOCTYPE html>
      <html lang="zh">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>图片加载测试</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .image-container { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
          h2 { margin-top: 0; }
          img { max-width: 100%; height: auto; display: block; margin: 10px 0; }
          pre { background: #f5f5f5; padding: 10px; overflow-x: auto; border-radius: 4px; }
          .success { color: green; }
          .error { color: red; }
          button { padding: 8px 16px; background: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #0051a2; }
        </style>
      </head>
      <body>
        <h1>图片加载测试</h1>
        <p>测试URL: <code>${imageUrl}</code></p>
        
        <div class="image-container">
          <h2>方法1: 直接加载</h2>
          <div id="direct-status">加载中...</div>
          <img 
            id="direct-img" 
            src="${imageUrl}" 
            alt="直接加载测试" 
            onerror="document.getElementById('direct-status').innerHTML='<span class=\\'error\\'>❌ 加载失败</span>'" 
            onload="document.getElementById('direct-status').innerHTML='<span class=\\'success\\'>✅ 加载成功</span>'"
          />
          <pre>img src="${imageUrl}"</pre>
        </div>
        
        <div class="image-container">
          <h2>方法2: 通过标准代理加载</h2>
          <div id="proxy-status">加载中...</div>
          <img 
            id="proxy-img" 
            src="/api/image-proxy?url=${encodeURIComponent(imageUrl)}" 
            alt="标准代理加载测试" 
            onerror="document.getElementById('proxy-status').innerHTML='<span class=\\'error\\'>❌ 加载失败</span>'" 
            onload="document.getElementById('proxy-status').innerHTML='<span class=\\'success\\'>✅ 加载成功</span>'"
          />
          <pre>img src="/api/image-proxy?url=${encodeURIComponent(imageUrl)}"</pre>
        </div>
        
        <div class="image-container">
          <h2>方法3: 通过直接代理加载</h2>
          <div id="direct-proxy-status">加载中...</div>
          <img 
            id="direct-proxy-img" 
            src="/api/direct-proxy?url=${encodeURIComponent(imageUrl)}" 
            alt="直接代理加载测试" 
            onerror="document.getElementById('direct-proxy-status').innerHTML='<span class=\\'error\\'>❌ 加载失败</span>'" 
            onload="document.getElementById('direct-proxy-status').innerHTML='<span class=\\'success\\'>✅ 加载成功</span>'"
          />
          <pre>img src="/api/direct-proxy?url=${encodeURIComponent(imageUrl)}"</pre>
        </div>
        
        <div class="image-container">
          <h2>方法4: fetch API 加载</h2>
          <div id="fetch-status">未测试</div>
          <div id="fetch-result"></div>
          <button onclick="testFetch()">测试 fetch</button>
          <pre>fetch("${imageUrl}")</pre>
        </div>
        
        <div class="image-container">
          <h2>方法5: 标准代理 fetch API 加载</h2>
          <div id="proxy-fetch-status">未测试</div>
          <div id="proxy-fetch-result"></div>
          <button onclick="testProxyFetch()">测试标准代理 fetch</button>
          <pre>fetch("/api/image-proxy?url=${encodeURIComponent(imageUrl)}")</pre>
        </div>
        
        <div class="image-container">
          <h2>方法6: 直接代理 fetch API 加载</h2>
          <div id="direct-proxy-fetch-status">未测试</div>
          <div id="direct-proxy-fetch-result"></div>
          <button onclick="testDirectProxyFetch()">测试直接代理 fetch</button>
          <pre>fetch("/api/direct-proxy?url=${encodeURIComponent(imageUrl)}")</pre>
        </div>
        
        <script>
          async function testFetch() {
            const status = document.getElementById('fetch-status');
            const result = document.getElementById('fetch-result');
            status.innerHTML = '加载中...';
            
            try {
              const response = await fetch("${imageUrl}");
              if (response.ok) {
                const blob = await response.blob();
                const imgUrl = URL.createObjectURL(blob);
                result.innerHTML = '<img src="' + imgUrl + '" alt="Fetch 测试" />';
                status.innerHTML = '<span class="success">✅ 加载成功</span>';
              } else {
                status.innerHTML = '<span class="error">❌ 加载失败: ' + response.status + ' ' + response.statusText + '</span>';
              }
            } catch (error) {
              status.innerHTML = '<span class="error">❌ 加载错误: ' + error.message + '</span>';
            }
          }
          
          async function testProxyFetch() {
            const status = document.getElementById('proxy-fetch-status');
            const result = document.getElementById('proxy-fetch-result');
            status.innerHTML = '加载中...';
            
            try {
              const response = await fetch("/api/image-proxy?url=${encodeURIComponent(imageUrl)}");
              if (response.ok) {
                const blob = await response.blob();
                const imgUrl = URL.createObjectURL(blob);
                result.innerHTML = '<img src="' + imgUrl + '" alt="标准代理 Fetch 测试" />';
                status.innerHTML = '<span class="success">✅ 加载成功</span>';
              } else {
                status.innerHTML = '<span class="error">❌ 加载失败: ' + response.status + ' ' + response.statusText + '</span>';
              }
            } catch (error) {
              status.innerHTML = '<span class="error">❌ 加载错误: ' + error.message + '</span>';
            }
          }
          
          async function testDirectProxyFetch() {
            const status = document.getElementById('direct-proxy-fetch-status');
            const result = document.getElementById('direct-proxy-fetch-result');
            status.innerHTML = '加载中...';
            
            try {
              const response = await fetch("/api/direct-proxy?url=${encodeURIComponent(imageUrl)}");
              if (response.ok) {
                const blob = await response.blob();
                const imgUrl = URL.createObjectURL(blob);
                result.innerHTML = '<img src="' + imgUrl + '" alt="直接代理 Fetch 测试" />';
                status.innerHTML = '<span class="success">✅ 加载成功</span>';
              } else {
                status.innerHTML = '<span class="error">❌ 加载失败: ' + response.status + ' ' + response.statusText + '</span>';
              }
            } catch (error) {
              status.innerHTML = '<span class="error">❌ 加载错误: ' + error.message + '</span>';
            }
          }
        </script>
      </body>
      </html>
    `;
    
    // 返回HTML页面
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('调试图片API出错:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
} 