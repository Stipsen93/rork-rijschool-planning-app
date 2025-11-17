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
      firstName: z.string(),
      lastName: z.string(),
      role: z.enum(['instructor', 'student']),
      phone: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { email, password, firstName, lastName, role, phone } = input;
    const fullName = `${firstName} ${lastName}`;

    const { data: authData, error: authError } = await ctx.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: phone || null,
        }
      }
    });

    if (authError || !authData.user) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: authError?.message || 'Failed to create account',
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (role === 'instructor') {
      const instructorData: InstructorProfileInsert = {
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        rating: 0,
        total_lessons: 0,
      };
      const { error: instructorError } = await ctx.supabase
        .from('instructor_profiles')
        .insert(instructorData as any);
      
      if (instructorError) {
        console.error('Error creating instructor profile:', instructorError);
      }
    } else if (role === 'student') {
      const studentData: StudentProfileInsert = {
        user_id: authData.user.id,
        lesson_streak: 0,
        total_lessons_completed: 0,
        hours_driven: 0,
        overall_progress: 0,
      };
      const { error: studentError } = await ctx.supabase
        .from('student_profiles')
        .insert(studentData as any);
      
      if (studentError) {
        console.error('Error creating student profile:', studentError);
      }
    }

    return {
      user: authData.user,
      session: authData.session,
    };
  });
