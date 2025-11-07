import { publicProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Database } from '@/types/supabase';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type InstructorProfileInsert = Database['public']['Tables']['instructor_profiles']['Insert'];
type StudentProfileInsert = Database['public']['Tables']['student_profiles']['Insert'];

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

    const profileData: ProfileInsert = {
      id: authData.user.id,
      email,
      full_name: fullName,
      role,
      phone: phone || null,
      is_active: true,
    };

    const { error: profileError } = await ctx.supabase
      .from('profiles')
      .insert(profileData as any);

    if (profileError) {
      await ctx.supabase.auth.admin.deleteUser(authData.user.id);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user profile',
      });
    }

    if (role === 'instructor') {
      const instructorData: InstructorProfileInsert = {
        user_id: authData.user.id,
        rating: 0,
        total_lessons: 0,
      };
      await ctx.supabase
        .from('instructor_profiles')
        .insert(instructorData as any);
    } else if (role === 'student') {
      const studentData: StudentProfileInsert = {
        user_id: authData.user.id,
        lesson_streak: 0,
        total_lessons_completed: 0,
        hours_driven: 0,
        overall_progress: 0,
      };
      await ctx.supabase
        .from('student_profiles')
        .insert(studentData as any);
    }

    return {
      user: authData.user,
      session: authData.session,
    };
  });
