import { TRPCError } from "@trpc/server";
import { createTRPCRouter, privateProcedure } from "../trpc";
import { z } from "zod";

// calculates a duration of the database operation
export const handleDuration = async (handler: any) => {
  // sets current time
  const startTime = process.hrtime();
  const result = await handler;
  const duration = process.hrtime(startTime);

  // Calculate the duration in milliseconds
  const milliseconds = duration[0] + duration[1] / 1e9;

  console.log("\n\nDuration of the prisma operation:", milliseconds, "\n\n");
  return { result };
};

// chats router
export const chatsRouter = createTRPCRouter({
  // gets a list of chats based on user id
  getAllById: privateProcedure
    // validates input values
    .input(z.object({ id: z.string() }))
    // make a query to the database
    .query(async ({ ctx, input }) => {
      const chats = await ctx.prisma.chat.findMany({
        where: { OR: [{ user1_id: input.id }, { user2_id: input.id }] },
      });

      return chats;
    }),
  // updates a chat when a new message is sent
  update: privateProcedure
    // validates input values
    .input(
      z.object({
        id: z.string(),
        last_message: z.string(),
        last_message_createdAt: z.date(),
      })
    )
    // mutates || updates a chat
    .mutation(async ({ ctx, input }) => {
      const updatedChat = await ctx.prisma.chat.update({
        where: { id: input.id },
        data: {
          last_message: input.last_message,
          last_message_createdAt: input.last_message_createdAt,
        },
      });

      // throws an error if something goes wrong
      if (!updatedChat)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error occured during updating a chat",
        });

      // returns an updated chat
      return updatedChat;
    }),
  // create a new chat
  create: privateProcedure
    // validates input values
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
    // creates a new chat
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

      // throws an error if something goes wrong
      if (!chat)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error occured during creating a chat",
        });

      // returns a new chat
      return chat;
    }),
  // deletes a chat
  delete: privateProcedure
    // validates input values
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deletedChat = await ctx.prisma.chat.delete({
        where: { id: input.id },
      });

      // throws an error if something goes wrong
      if (!deletedChat)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error occured during deleting a chat",
        });

      // returns a deleted chat
      return deletedChat;
    }),
});
