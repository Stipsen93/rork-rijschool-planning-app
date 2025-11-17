import { protectedProcedure } from '../../../create-context';
import { z } from 'zod';

export const listLessonsProcedure = protectedProcedure
  .input(
    z
      .object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
      })
      .optional()
  )
  .query(async ({ ctx, input }) => {
    let query = ctx.supabase
      .from('lessons')
      .select(
        `
        *,
        instructor:instructor_id(id, first_name, last_name, avatar_url, phone),
        student:student_id(id, first_name, last_name, avatar_url, phone)
      `
      );

    if (ctx.profile.role === 'instructor') {
      query = query.eq('instructor_id', ctx.user.id);
    } else if (ctx.profile.role === 'student') {
      query = query.eq('student_id', ctx.user.id);
    }

    if (input?.startDate) {
      query = query.gte('start_time', input.startDate);
    }

    if (input?.endDate) {
      query = query.lte('start_time', input.endDate);
    }

    if (input?.status) {
      query = query.eq('status', input.status);
    }

    query = query.order('start_time', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching lessons:', error);
      return [];
    }

    return data || [];
  });
