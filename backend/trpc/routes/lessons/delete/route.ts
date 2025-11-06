import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const deleteLessonProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string().uuid(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: lesson } = await ctx.supabase
      .from('lessons')
      .select('instructor_id, student_id')
      .eq('id', input.id)
      .single();

    if (!lesson) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Lesson not found',
      });
    }

    const isInstructor = ctx.profile.role === 'instructor';
    const isStudent = ctx.profile.role === 'student';

    if (
      (isInstructor && lesson.instructor_id !== ctx.user.id) ||
      (isStudent && lesson.student_id !== ctx.user.id)
    ) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only delete your own lessons',
      });
    }

    const { error } = await ctx.supabase.from('lessons').delete().eq('id', input.id);

    if (error) {
      console.error('Error deleting lesson:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete lesson',
      });
    }

    return { success: true };
  });
