/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_GITHUB_REPO: process.env.GITHUB_REPO_URL,
    NEXT_PUBLIC_UPDATE_INTERVAL: '30000', // 30 seconds
  },
}

module.exports = nextConfig
