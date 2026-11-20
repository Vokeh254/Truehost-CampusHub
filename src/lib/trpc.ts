import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/root";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc = createTRPCReact<AppRouter>() as any;
