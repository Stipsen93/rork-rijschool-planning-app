import { protectedProcedure } from '../../../create-context';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const updateLessonProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string().uuid(),
      title: z.string().optional(),
      lessonType: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      duration: z.number().optional(),
      location: z.string().optional(),
      pickupLocation: z.string().optional(),
      vehicleId: z.string().uuid().optional(),
      notes: z.string().optional(),
      instructorNotes: z.string().optional(),
      studentNotes: z.string().optional(),
      status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
      rating: z.number().min(0).max(5).optional(),
      skillsImproved: z.array(z.string()).optional(),
      cancellationReason: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: lesson } = await ctx.supabase
      .from('lessons')
      .select('*')
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

    if (isInstructor && lesson.instructor_id !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only update your own lessons',
      });
    }

    if (isStudent && lesson.student_id !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only update your own lessons',
      });
    }

    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.lessonType !== undefined) updateData.lesson_type = input.lessonType;
    if (input.startTime !== undefined) updateData.start_time = input.startTime;
    if (input.endTime !== undefined) updateData.end_time = input.endTime;
    if (input.duration !== undefined) updateData.duration = input.duration;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.pickupLocation !== undefined) updateData.pickup_location = input.pickupLocation;
    if (input.vehicleId !== undefined) updateData.vehicle_id = input.vehicleId;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.instructorNotes !== undefined) updateData.instructor_notes = input.instructorNotes;
    if (input.studentNotes !== undefined) updateData.student_notes = input.studentNotes;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.rating !== undefined) updateData.rating = input.rating;
    if (input.skillsImproved !== undefined) updateData.skills_improved = input.skillsImproved;
    if (input.cancellationReason !== undefined) {
      updateData.cancellation_reason = input.cancellationReason;
      updateData.cancelled_by = ctx.user.id;
    }

    const { data, error } = await ctx.supabase
      .from('lessons')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lesson:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update lesson',
      });
    }

    return data;
  });
