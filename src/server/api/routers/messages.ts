import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { handleDuration } from "./chats";
import { observable } from "@trpc/server/observable";
import { create } from "domain";
import { EventEmitter } from "stream";

const ee = new EventEmitter();

export const messagesRouter = createTRPCRouter({
  getAllByChatId: privateProcedure
    .input(z.object({ chat_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.message.findMany({
        where: { chat_id: input.chat_id },
      });
      return messages;
    }),
  create: privateProcedure
    .input(
      z.object({
        message: z.string(),
        user_id: z.string(),
        chat_id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { result: message } = await handleDuration(
        ctx.prisma.message.create({
          data: {
            message: input.message,
            user_id: input.user_id,
            chat_id: input.chat_id,
          },
        })
      );
      if (!message) throw new TRPCError({ code: "BAD_REQUEST" });

      ee.emit("create", message);
      return message;
    }),
});
