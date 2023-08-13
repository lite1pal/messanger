import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { handleDuration } from "./chats";
import { EventEmitter } from "stream";

// declares a new EventEmitter that can emit an event to front-end
const ee = new EventEmitter();

// messages router that listens for requests from front-end and then validates incomeing data, makes certain calculations and sends a response back to front-end
export const messagesRouter = createTRPCRouter({
  // gets a list of messages based on chat id
  getAllByChatId: privateProcedure
    // validates input values
    .input(z.object({ chat_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.message.findMany({
        where: { chat_id: input.chat_id },
      });
      return messages;
    }),
  // creates a new message
  create: privateProcedure
    // validates input values
    .input(
      z.object({
        message: z.string(),
        imageId: z.string(),
        user_id: z.string(),
        chat_id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { result: message } = await handleDuration(
        ctx.prisma.message.create({
          data: {
            message: input.message,
            imageId: input.imageId,
            user_id: input.user_id,
            chat_id: input.chat_id,
          },
        })
      );
      if (!message)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error occured during creating a new message",
        });

      ee.emit("create", message);
      return message;
    }),
});
