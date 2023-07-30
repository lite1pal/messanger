import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const messagesRouter = createTRPCRouter({
  getAllByChatId: publicProcedure
    .input(z.object({ chat_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.message.findMany({
        where: { chat_id: input.chat_id },
      });
      return messages;
    }),
  create: publicProcedure
    .input(
      z.object({
        message: z.string(),
        user_id: z.string(),
        chat_id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.prisma.message.create({
        data: {
          message: input.message,
          user_id: input.user_id,
          chat_id: input.chat_id,
        },
      });
      if (!message) throw new TRPCError({ code: "BAD_REQUEST" });

      return message;
    }),
});
