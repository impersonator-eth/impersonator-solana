/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // to remove double rendering of the page (which resulted in 2 sessions being created for each approve)
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty");
    return config;
  },
  compiler: {
    styledComponents: true,
  },
};

module.exports = nextConfig;
