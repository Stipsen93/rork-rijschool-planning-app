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
      wrmNumber: z.string().regex(/^\d+$/, 'WRM nummer mag alleen cijfers bevatten').min(5, 'WRM nummer moet minimaal 5 cijfers bevatten').optional(),
      drivingschoolId: z.string().uuid().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { email, password, firstName, lastName, role, phone, drivingschoolId } = input;
    const fullName = `${firstName} ${lastName}`;

    const { data: authData, error: authError } = await ctx.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          role: role,
          phone: phone || null,
          drivingschool_id: drivingschoolId || null,
        }
      }
    });

    if (authError || !authData.user) {
      console.error('Signup error:', authError);
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: authError?.message || 'Failed to create account',
      });
    }

    return {
      user: authData.user,
      session: authData.session,
    };
  });
