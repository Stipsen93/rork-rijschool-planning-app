import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const createLessonProcedure = protectedProcedure
  .input(
    z.object({
      instructorId: z.string().uuid(),
      studentId: z.string().uuid(),
      title: z.string(),
      lessonType: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      duration: z.number(),
      location: z.string().optional(),
      pickupLocation: z.string().optional(),
      vehicleId: z.string().uuid().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const isInstructor = ctx.profile.role === 'instructor';
    const isStudent = ctx.profile.role === 'student';

    if (isInstructor && input.instructorId !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only create lessons for yourself',
      });
    }

    if (isStudent && input.studentId !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only create lessons for yourself',
      });
    }

    const { data, error } = await ctx.supabase
      .from('lessons')
      .insert({
        instructor_id: input.instructorId,
        student_id: input.studentId,
        title: input.title,
        lesson_type: input.lessonType,
        start_time: input.startTime,
        end_time: input.endTime,
        duration: input.duration,
        location: input.location || null,
        pickup_location: input.pickupLocation || null,
        vehicle_id: input.vehicleId || null,
        notes: input.notes || null,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lesson:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create lesson',
      });
    }

    return data;
  });
