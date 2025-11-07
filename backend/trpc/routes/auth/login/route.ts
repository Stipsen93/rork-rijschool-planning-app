import { publicProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const loginProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { email, password } = input;

    const { data, error } = await ctx.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    const { data: profileData } = await ctx.supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profileData) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User profile not found',
      });
    }

    const profile = profileData as Profile;

    if (!profile.is_active) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Your account is not active. Please contact support.',
      });
    }

    return {
      user: data.user,
      session: data.session,
      profile,
    };
  });
