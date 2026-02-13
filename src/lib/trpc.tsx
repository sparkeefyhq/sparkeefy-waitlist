import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/backend/trpc/router';

export const trpc = createTRPCReact<AppRouter>();

const apiPort = process.env.PORT || '4000';
const trpcUrl =
  process.env.NEXT_PUBLIC_API_URL || `http://localhost:${apiPort}/trpc`;

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
    }),
  ],
});
