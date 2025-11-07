import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { createClient, User } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

const supabaseUrl = 'https://gqipssfphzysaehwefga.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaXBzc2ZwaHp5c2FlaHdlZmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzExMjUsImV4cCI6MjA3ODA0NzEyNX0.v41MB4Q2tzthg9u7VE4-E3z5tyG7YV8kySLBE9zS3Cg';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '');

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });

  let user: User | null = null;
  let profile: Profile | null = null;

  if (accessToken) {
    const { data: { user: authUser } } = await supabase.auth.getUser(accessToken);
    user = authUser;

    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      profile = data;
    }
  }

  return {
    req: opts.req,
    supabase,
    user,
    profile,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.profile) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user as User,
      profile: ctx.profile as Profile,
    },
  });
});

export const instructorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.profile.role !== 'instructor') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be an instructor to access this resource',
    });
  }

  return next({ ctx });
});

export const studentProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.profile.role !== 'student') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be a student to access this resource',
    });
  }

  return next({ ctx });
});
