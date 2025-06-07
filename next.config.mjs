/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用TypeScript类型检查
  typescript: {
    // !! 警告：仅在你无法解决类型问题时使用这个选项
    ignoreBuildErrors: true,
  },
  // 禁用ESLint检查
  eslint: {
    // !! 警告：仅在你无法解决ESLint错误时使用这个选项
    ignoreDuringBuilds: true,
  }
};

export default nextConfig; 