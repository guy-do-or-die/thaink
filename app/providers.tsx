'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi-config';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

if (!PRIVY_APP_ID) {
  throw new Error('VITE_PRIVY_APP_ID environment variable is not set');
}

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          loginMethods: ['wallet'],
          appearance: {
            theme: 'light',
            accentColor: '#676FFF',
            showWalletLoginFirst: true,
          },
        }}
      >
        <WagmiConfig config={config}>
          {children}
        </WagmiConfig>
      </PrivyProvider>
    </QueryClientProvider>
  );
}