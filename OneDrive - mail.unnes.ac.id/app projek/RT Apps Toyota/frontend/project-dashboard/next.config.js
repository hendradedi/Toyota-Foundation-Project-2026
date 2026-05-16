/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  basePath: '/Toyota-Foundation-Project-2026',
  assetPrefix: '/Toyota-Foundation-Project-2026/',
  env: {
    NEXT_PUBLIC_GITHUB_REPO: process.env.GITHUB_REPO_URL,
    NEXT_PUBLIC_UPDATE_INTERVAL: '30000', // 30 seconds
  },
}

module.exports = nextConfig
