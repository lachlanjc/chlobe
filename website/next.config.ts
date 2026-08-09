import withStyleX from '@stylexswc/nextjs-plugin';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = withStyleX({
  rsOptions: {
    dev: process.env.NODE_ENV !== 'production',
  },
})({});

export default nextConfig;
