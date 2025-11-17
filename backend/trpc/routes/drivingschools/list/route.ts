import { publicProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';

export const listDrivingschoolsProcedure = publicProcedure
  .query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('drivingschools')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching drivingschools:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch drivingschools',
      });
    }

    return data || [];
  });
