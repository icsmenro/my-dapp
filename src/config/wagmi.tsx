import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { mainnet, arbitrum, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { ReactNode } from 'react';
import { http } from 'wagmi';

const queryClient = new QueryClient();
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not set in .env');
}

const metadata = {
  name: 'WeedLend Finance',
  description: 'A decentralized platform for medicinal cannabis finance',
  url: import.meta.env.VITE_APP_URL || 'https://your-production-url.vercel.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

const wagmiAdapter = new WagmiAdapter({
  networks: [sepolia, mainnet, arbitrum],
  projectId,
  ssr: true,
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
  },
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [sepolia, mainnet, arbitrum],
  projectId,
  metadata,
  features: { analytics: false },
  debug: false,
  themeVariables: {
    '--w3m-accent': '#1A7F3D',
  },
});

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}