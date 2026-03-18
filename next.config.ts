import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fix monorepo file-tracing: point to the workspace root so Next.js
  // can include shared packages (packages/*) in the production bundle.
  outputFileTracingRoot: path.join(__dirname, '../'),
  // Keep Prisma, Sharp and other Node-only packages out of the webpack
  // client bundle — they must only run on the server.
  serverExternalPackages: ['@prisma/client', 'prisma', 'sharp', 'mindee'],
  webpack(config) {
    // pnpm symlinks cause webpack to resolve the generated Prisma browser
    // client relative to the pnpm virtual store rather than the project's
    // node_modules. Provide an explicit alias to the correct generated path.
    config.resolve.alias = {
      ...config.resolve.alias,
      '.prisma/client/index-browser': path.resolve(
        __dirname,
        'node_modules/.prisma/client/index-browser.js',
      ),
    };
    return config;
  },
};

export default nextConfig;
