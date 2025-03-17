/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use export and out directory for production builds
  ...(process.env.NODE_ENV === 'production' ? {
    output: 'export', // Enable static export for production
    distDir: 'out', // Direct output to 'out' folder for production
  } : {}),

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
