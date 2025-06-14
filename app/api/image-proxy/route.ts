import { NextRequest, NextResponse } from 'next/server';

/**
 * 图片代理API - 用于解决Notion图片链接过期问题
 * 
 * 本API接收一个图片URL作为查询参数，然后:
 * 1. 获取原始图片
 * 2. 设置适当的缓存头
 * 3. 将图片内容返回给客户端
 * 
 * 使用方法: /api/image-proxy?url=https://example.com/image.jpg
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数中的URL
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    // 验证URL参数
    if (!imageUrl) {
      console.error('图片代理错误: 缺少URL参数');
      return new NextResponse('Missing URL parameter', { status: 400 });
    }
    
    // 验证URL是否为有效的图片链接 - 放宽限制，允许所有图片源
    // 只做基本的安全检查，确保是HTTP/HTTPS链接
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      console.error(`图片代理错误: 无效的URL: ${imageUrl}`);
      return new NextResponse('Invalid image URL', { status: 400 });
    }
    
    console.log(`图片代理请求: ${imageUrl}`);
    
    // 清理URL，移除查询参数
    let cleanUrl = imageUrl;
    if (imageUrl.includes('?')) {
      cleanUrl = imageUrl.split('?')[0];
      console.log(`清理后的URL: ${cleanUrl}`);
    }
    
    // 设置更短的超时时间
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 增加到10秒超时
    
    try {
      // 获取图片内容
      console.log(`开始获取图片: ${cleanUrl}`);
      const imageResponse = await fetch(cleanUrl, {
        headers: {
          // 添加一些基本的请求头以模拟浏览器请求
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/avif,image/png,image/jpeg,*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': 'https://www.notion.so/',
          'Origin': 'https://www.notion.so',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);
      
      // 检查响应状态
      if (!imageResponse.ok) {
        console.error(`获取图片失败: ${imageResponse.status} ${imageResponse.statusText}`);
        console.error(`响应头: ${JSON.stringify([...imageResponse.headers.entries()])}`);
        return new NextResponse(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`, { status: imageResponse.status });
      }
      
      // 获取图片数据
      const imageData = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      console.log(`成功获取图片: ${cleanUrl}, 大小: ${imageData.byteLength} 字节, 类型: ${contentType}`);
      
      // 创建响应对象
      const response = new NextResponse(imageData, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          // 设置长期缓存，因为Notion的S3图片URL基本部分不会变
          'Cache-Control': 'public, max-age=31536000, immutable',
          // 安全头
          'X-Content-Type-Options': 'nosniff',
        },
      });
      
      return response;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error(`获取图片时发生错误: ${fetchError.message}`);
      throw fetchError;
    }
  } catch (error) {
    console.error('图片代理出错:', error);
    // 如果是超时错误，返回特定的状态码
    if (error.name === 'AbortError') {
      return new NextResponse('Request timeout', { status: 504 });
    }
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
} 