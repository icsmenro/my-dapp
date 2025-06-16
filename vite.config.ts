import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  const scriptSrc = [
    "'self'",
    'https://cloud.reown.com',
    // ❌ NO 'unsafe-eval' or 'unsafe-inline' in production
    ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
  ].join(' ');

  const contentSecurityPolicy = [
    `default-src 'self';`,
    `script-src ${scriptSrc};`,
    `connect-src 'self' https://rpc.walletconnect.org wss://rpc.walletconnect.org https://rpc.walletconnect.com wss://rpc.walletconnect.com https://mainnet.infura.io https://api.web3modal.org https://pulse.walletconnect.org wss://relay.walletconnect.org https://rpc.sepolia.org;`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com;`,
    `style-src-attr 'unsafe-inline';`,
    `img-src 'self' data: blob: https://avatars.githubusercontent.com https://api.web3modal.org https://tokens.1inch.io;`,
    `font-src 'self' https://fonts.gstatic.com;`,
    `frame-src 'self' https://verify.walletconnect.org https://secure.walletconnect.org;`,
  ].join(' ');

  return {
    plugins: [
      react(),
      nodePolyfills({
        include: ['buffer', 'process', 'util'],
        globals: {
          Buffer: true,
          process: true,
        },
      }),
      visualizer({
        filename: 'bundle-analysis.html',
        open: false,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@artifacts': path.resolve(__dirname, './artifacts'),
        'node-fetch': 'isomorphic-fetch',
        crypto: 'crypto-browserify',
        stream: 'stream-browserify',
        assert: 'assert',
        http: 'stream-http',
        https: 'https-browserify',
        os: 'os-browserify',
        url: 'url',
        util: 'util',
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'ethers', 'viem', 'wagmi', '@tanstack/react-query'],
            three: ['three'],
            reactThree: ['@react-three/fiber', '@react-three/drei'],
            reown: ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
          },
        },
      },
    },
    server: {
      port: 5173,
      open: true,
      cors: true,
      headers: {
        'Content-Security-Policy': contentSecurityPolicy,
      },
      proxy: {
        '/api': {
          target: 'https://sepolia.infura.io/v3',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    optimizeDeps: {
      include: ['ethers', 'viem', 'wagmi', 'three', '@reown/appkit', '@reown/appkit-adapter-wagmi'],
    },
  };
<<<<<<< HEAD
});
=======
});
>>>>>>> 0ec166a (WIP: save before rebase)
