import { publicProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const signupProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      fullName: z.string(),
      role: z.enum(['instructor', 'student']),
      phone: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { email, password, fullName, role, phone } = input;

    const { data: authData, error: authError } = await ctx.supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: authError?.message || 'Failed to create account',
      });
    }

    const { error: profileError } = await ctx.supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        phone: phone || null,
        is_active: true,
      });

    if (profileError) {
      await ctx.supabase.auth.admin.deleteUser(authData.user.id);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user profile',
      });
    }

    if (role === 'instructor') {
      await ctx.supabase
        .from('instructor_profiles')
        .insert({
          user_id: authData.user.id,
          rating: 0,
          total_lessons: 0,
        });
    } else if (role === 'student') {
      await ctx.supabase
        .from('student_profiles')
        .insert({
          user_id: authData.user.id,
          lesson_streak: 0,
          total_lessons_completed: 0,
          hours_driven: 0,
          overall_progress: 0,
        });
    }

    return {
      user: authData.user,
      session: authData.session,
    };
  });
