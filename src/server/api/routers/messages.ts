import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { handleDuration } from "./chats";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/nodejs";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/ratelimit",
});

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
      const { success } = await ratelimit.limit(input.user_id);

      if (!success) {
        return { ratelimit: true };
      }
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

      return message;
    }),
  deleteAllByChatId: privateProcedure
    .input(z.object({ chat_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.message.deleteMany({
        where: { chat_id: input.chat_id },
      });
      return result;
    }),
});
