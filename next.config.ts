import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

try {
  const src = "C:\\Users\\Administrator\\Documents\\Juga sistemas\\6x\\logo SF 2 juga@6x.png";
  const dest = path.join(process.cwd(), 'public', 'logo-juga.png');
  // Ensure public folder exists
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log("✅ [Next.config] Logo copied successfully to", dest);
  } else {
    console.warn("⚠️ [Next.config] Source logo not found at:", src);
  }
} catch (e) {
  console.error("❌ [Next.config] Error copying logo:", e);
}

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: /Redesign ERP SaaS JUGA/,
      use: 'ignore-loader'
    });
    return config;
  },
  async headers() {
    return [
      {
        // 为所有路由应用这些头
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // 生产环境应限制为特定域名
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
          {
            key: "X-Frame-Options",
            value: "ALLOWALL", // 允许同源iframe嵌入，如需允许所有域名可改为 "ALLOWALL" 或删除此头
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' *", // 允许iframe嵌入，'self'表示同源，*表示所有域名
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "images.pexels.com",
      },
      {
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
