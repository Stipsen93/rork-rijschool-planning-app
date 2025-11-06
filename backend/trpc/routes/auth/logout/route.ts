import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';

export const logoutProcedure = protectedProcedure.mutation(async ({ ctx }) => {
  const { error } = await ctx.supabase.auth.signOut();

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to logout',
    });
  }

  return { success: true };
});
