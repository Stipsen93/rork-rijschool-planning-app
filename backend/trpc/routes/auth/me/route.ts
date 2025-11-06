import { protectedProcedure } from '../../../create-context';

export const meProcedure = protectedProcedure.query(async ({ ctx }) => {
  let extendedProfile = null;

  if (ctx.profile.role === 'instructor') {
    const { data } = await ctx.supabase
      .from('instructor_profiles')
      .select('*')
      .eq('user_id', ctx.user.id)
      .single();

    extendedProfile = data;
  } else if (ctx.profile.role === 'student') {
    const { data } = await ctx.supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', ctx.user.id)
      .single();

    extendedProfile = data;
  }

  return {
    user: ctx.user,
    profile: ctx.profile,
    extendedProfile,
  };
});
