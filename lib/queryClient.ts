import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export function resetQueryClient(): void {
  console.log("[QueryClient] Clearing all caches");
  queryClient.clear();
  queryClient.getMutationCache().clear();
}
