import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs";

export const chatsRouter = createTRPCRouter({
  getAllById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const chats = await ctx.prisma.chat.findMany({
        where: { OR: [{ user1_id: input.id }, { user2_id: input.id }] },
      });
      return chats;
    }),
  create: publicProcedure
    .input(
      z.object({
        user1_id: z.string(),
        user1_name: z.string(),
        user1_imageUrl: z.string(),
        user2_id: z.string(),
        user2_name: z.string(),
        user2_imageUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.prisma.chat.create({
        data: {
          user1_id: input.user1_id,
          user1_name: input.user1_name,
          user1_imageUrl: input.user1_imageUrl,
          user2_id: input.user2_id,
          user2_name: input.user2_name,
          user2_imageUrl: input.user2_imageUrl,
        },
      });
      // const user1 = await clerkClient.users.getUser(input.user1_id);
      // const user2 = await clerkClient.users.getUser(input.user2_id);
      if (!chat) throw new TRPCError({ code: "BAD_REQUEST" });
      return chat;
    }),
});
