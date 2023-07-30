import { clerkClient } from "@clerk/nextjs";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const usersRouter = createTRPCRouter({
  getAllUsers: publicProcedure.query(async ({ ctx }) => {
    const users = await clerkClient.users.getUserList();
    if (!users) throw new TRPCError({ code: "BAD_REQUEST" });
    return users;
  }),
  getUserById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await clerkClient.users.getUser(input.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),
});
