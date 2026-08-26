/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: false },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};
export default nextConfig;
