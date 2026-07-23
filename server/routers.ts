import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { strava } from "./_core/strava";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ─── Strava Integration ───────────────────────────────────────────────
  strava: router({
    /** Check if the user has Strava connected */
    status: publicProcedure.query(async () => {
      const status = await strava.getConnectionStatus("default");
      if (!status.connected) {
        return { connected: false, athlete: null };
      }
      try {
        const athlete = await strava.getAthlete("default");
        return {
          connected: true,
          athlete: {
            id: athlete.id,
            firstname: athlete.firstname,
            lastname: athlete.lastname,
            city: athlete.city,
            country: athlete.country,
            profile: athlete.profile,
            premium: athlete.premium,
          },
        };
      } catch {
        return { connected: true, athlete: null };
      }
    }),

    /** List activities from Strava (fetches live from Strava API) */
    activities: router({
      list: publicProcedure
        .input(
          z
            .object({
              page: z.number().min(1),
              perPage: z.number().min(1).max(200),
            })
            .partial(),
        )
        .query(async ({ input }) => {
          const page = input.page ?? 1;
          const perPage = input.perPage ?? 30;
          const activities = await strava.getActivities(
            "default",
            page,
            perPage,
          );
          return { activities };
        }),
    }),

    /** Get a single activity by Strava ID */
    activityById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const activity = await strava.getActivityById("default", input.id);
        return { activity };
      }),

    /** Get full athlete profile */
    athlete: publicProcedure.query(async () => {
      const athlete = await strava.getAthlete("default");
      return { athlete };
    }),
  }),
});

export type AppRouter = typeof appRouter;
