import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  webpack: (config, { isServer }) => {
    // Suprimir avisos conhecidos de acessibilidade durante o desenvolvimento
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },
};

export default nextConfig;
