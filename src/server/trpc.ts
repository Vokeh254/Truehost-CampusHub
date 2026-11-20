import { initTRPC, TRPCError } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db";
import { UserSystemRole } from "@prisma/client";

export type TRPCContext = {
  req: NextRequest;
  session: {
    user: { id: string; email: string; name: string; systemRole: string };
  } | null;
  db: typeof db;
};

export async function createTRPCContext(opts: {
  req: NextRequest;
}): Promise<TRPCContext> {
  const session = await auth();
  return {
    req: opts.req,
    session: session as TRPCContext["session"],
    db,
  };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.session.user.systemRole !== UserSystemRole.SUPER_ADMIN) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const leadProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const role = ctx.session.user.systemRole as UserSystemRole;
  if (role !== UserSystemRole.SUPER_ADMIN && role !== UserSystemRole.CAMPUS_LEAD) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});
