const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
})

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: process.env.NODE_ENV === 'production'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost"
      },
      {
        protocol: "http",
        hostname: "127.0.0.1"
      },
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ["sharp"]
  },
  // Completely disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [] // Don't run ESLint on any directories
  },
  // Disable TypeScript type checking during builds
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: "tsconfig.json"
  }
}

module.exports = withBundleAnalyzer(
  withPWA(nextConfig)
)
