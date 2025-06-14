import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';

/**
 * 直接代理API - 使用Node.js的http模块直接转发请求
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数中的URL
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    // 验证URL参数
    if (!imageUrl) {
      console.error('直接代理错误: 缺少URL参数');
      return new NextResponse('Missing URL parameter', { status: 400 });
    }
    
    // 验证URL是否为有效的链接
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      console.error(`直接代理错误: 无效的URL: ${imageUrl}`);
      return new NextResponse('Invalid URL', { status: 400 });
    }
    
    console.log(`直接代理请求: ${imageUrl}`);
    
    // 创建一个Promise来处理HTTP请求
    const fetchImage = () => new Promise((resolve, reject) => {
      // 选择正确的模块
      const httpModule = imageUrl.startsWith('https://') ? https : http;
      
      // 设置请求选项
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/avif,image/png,image/jpeg,*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': 'https://www.notion.so/',
          'Origin': 'https://www.notion.so',
        },
        timeout: 10000, // 10秒超时
      };
      
      // 发起请求
      const req = httpModule.get(imageUrl, options, (res) => {
        // 检查响应状态
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch image: ${res.statusCode} ${res.statusMessage}`));
          return;
        }
        
        // 收集响应数据
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        
        // 处理完成的响应
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const contentType = res.headers['content-type'] || 'image/jpeg';
          
          resolve({
            buffer,
            contentType,
            headers: res.headers,
          });
        });
      });
      
      // 处理错误
      req.on('error', (error) => {
        console.error(`直接代理请求错误: ${error.message}`);
        reject(error);
      });
      
      // 设置超时
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
    
    try {
      // 获取图片数据
      const { buffer, contentType, headers } = await fetchImage() as any;
      
      console.log(`成功获取图片: ${imageUrl}, 大小: ${buffer.length} 字节, 类型: ${contentType}`);
      
      // 创建响应对象
      const response = new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      });
      
      return response;
    } catch (fetchError) {
      console.error(`获取图片时发生错误: ${fetchError.message}`);
      return new NextResponse(`Failed to fetch image: ${fetchError.message}`, { status: 500 });
    }
  } catch (error) {
    console.error('直接代理出错:', error);
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
} 