import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // Routes that do not require authentication
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/forgot-password(.*)",
    "/onboarding(.*)",
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
