/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd1q70pf5vjeyhc.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'zbsmgymyfhnwjdnmlelr.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
