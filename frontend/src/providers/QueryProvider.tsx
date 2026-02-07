'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 1 minute
        staleTime: 1000 * 60 * 1,
        // Keep data in cache for 5 minutes
        gcTime: 1000 * 60 * 5,
        // Retry failed requests 2 times
        retry: 2,
        // Don't refetch on window focus (we have manual polling)
        refetchOnWindowFocus: false,
        // Don't refetch when reconnecting (we have polling)
        refetchOnReconnect: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
