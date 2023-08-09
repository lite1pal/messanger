import { TRPCError } from "@trpc/server";
import { createTRPCRouter, privateProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs";
import cloudinary from "~/server/cloudinary";

export const handleDuration = async (handler: any) => {
  const startTime = process.hrtime();
  const result = await handler;
  const duration = process.hrtime(startTime);
  // Calculate the duration in milliseconds
  const milliseconds = duration[0] + duration[1] / 1e9;

  console.log("\n\nDuration of the prisma operation:", milliseconds, "\n\n");
  return { result };
};

export const chatsRouter = createTRPCRouter({
  getAllById: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const chats = await ctx.prisma.chat.findMany({
        where: { OR: [{ user1_id: input.id }, { user2_id: input.id }] },
      });

      return chats;
    }),
  update: privateProcedure
    .input(
      z.object({
        id: z.string(),
        last_message: z.string(),
        last_message_createdAt: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedChat = await ctx.prisma.chat.update({
        where: { id: input.id },
        data: {
          last_message: input.last_message,
          last_message_createdAt: input.last_message_createdAt,
        },
      });
      if (!updatedChat) throw new TRPCError({ code: "BAD_REQUEST" });
      return updatedChat;
    }),
  create: privateProcedure
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
      const { result: chat } = await handleDuration(
        ctx.prisma.chat.create({
          data: {
            user1_id: input.user1_id,
            user1_name: input.user1_name,
            user1_imageUrl: input.user1_imageUrl,
            user2_id: input.user2_id,
            user2_name: input.user2_name,
            user2_imageUrl: input.user2_imageUrl,
            last_message: "empty",
            last_message_createdAt: new Date(),
          },
        })
      );
      if (!chat) throw new TRPCError({ code: "BAD_REQUEST" });
      return chat;
    }),
  delete: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deletedChat = await ctx.prisma.chat.delete({
        where: { id: input.id },
      });
      if (!deletedChat) throw new TRPCError({ code: "BAD_REQUEST" });
      return deletedChat;
    }),
});
