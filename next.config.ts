import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Add these configurations to make API calls work in static export
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  // Ensure environment variables are available at build time
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  // Disable strict mode if it's causing issues with API calls
  reactStrictMode: false,
};

export default nextConfig;