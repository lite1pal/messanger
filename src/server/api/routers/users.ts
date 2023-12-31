import { clerkClient } from "@clerk/nextjs";
import { createTRPCRouter, privateProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// users router
export const usersRouter = createTRPCRouter({
  // gets all users
  getAllUsers: privateProcedure.query(async ({ ctx }) => {
    const users = await clerkClient.users.getUserList();
    if (!users) throw new TRPCError({ code: "BAD_REQUEST" });
    return users;
  }),
  // gets a user based on his id
  getUserById: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await clerkClient.users.getUser(input.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),
});
