/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true'
const repositoryName = (process.env.GITHUB_REPOSITORY || '').split('/')[1] || ''
const basePath = isGithubPages && repositoryName ? `/${repositoryName}` : ''

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_GITHUB_REPO: process.env.GITHUB_REPO_URL,
    NEXT_PUBLIC_UPDATE_INTERVAL: '30000', // 30 seconds
  },
}

module.exports = nextConfig
