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
import { sendLinkRequestProcedure } from "./routes/link-requests/send/route";
import { listLinkRequestsProcedure } from "./routes/link-requests/list/route";
import { respondLinkRequestProcedure } from "./routes/link-requests/respond/route";
import { myLinkRequestsProcedure } from "./routes/link-requests/my-requests/route";
import { cancelLinkRequestProcedure } from "./routes/link-requests/cancel/route";
import { searchInstructorsProcedure } from "./routes/instructors/search/route";
import { getStudentProfileProcedure } from "./routes/students/profile/route";
import { updateStudentProfileProcedure } from "./routes/students/update-profile/route";
import { studentPackagesProcedure } from "./routes/students/packages/route";

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
  linkRequests: createTRPCRouter({
    send: sendLinkRequestProcedure,
    list: listLinkRequestsProcedure,
    respond: respondLinkRequestProcedure,
    myRequests: myLinkRequestsProcedure,
    cancel: cancelLinkRequestProcedure,
  }),
  instructors: createTRPCRouter({
    search: searchInstructorsProcedure,
  }),
  students: createTRPCRouter({
    profile: getStudentProfileProcedure,
    updateProfile: updateStudentProfileProcedure,
    packages: studentPackagesProcedure,
  }),
});

export type AppRouter = typeof appRouter;
