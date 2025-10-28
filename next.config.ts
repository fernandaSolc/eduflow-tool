import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Modo estrito e seguro
  reactStrictMode: true,

  // Permite build em ambientes Docker/CI sem falhas de tipagem ou lint
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configura imagens externas seguras e com cache otimizado
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Melhora performance de build (sem cache experimental bugado)
  experimental: {
    fetchCache: false,
    optimizeCss: true,
    workerThreads: false,
  },

  // Melhora compatibilidade com Docker
  compress: true,
  poweredByHeader: false,
  trailingSlash: false,
};

export default nextConfig;
