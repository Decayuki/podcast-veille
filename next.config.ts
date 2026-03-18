import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isProd ? '/podcast-veille' : '',
  assetPrefix: isProd ? '/podcast-veille/' : '',
};

export default nextConfig;
