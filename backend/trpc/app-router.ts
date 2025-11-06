import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { signupProcedure } from "./routes/auth/signup/route";
import { loginProcedure } from "./routes/auth/login/route";
import { logoutProcedure } from "./routes/auth/logout/route";
import { meProcedure } from "./routes/auth/me/route";
import { createLessonProcedure } from "./routes/lessons/create/route";
import { listLessonsProcedure } from "./routes/lessons/list/route";
import { updateLessonProcedure } from "./routes/lessons/update/route";
import { deleteLessonProcedure } from "./routes/lessons/delete/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    signup: signupProcedure,
    login: loginProcedure,
    logout: logoutProcedure,
    me: meProcedure,
  }),
  lessons: createTRPCRouter({
    create: createLessonProcedure,
    list: listLessonsProcedure,
    update: updateLessonProcedure,
    delete: deleteLessonProcedure,
  }),
});

export type AppRouter = typeof appRouter;
