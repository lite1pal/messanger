import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { handleDuration } from "./chats";
import { observable } from "@trpc/server/observable";
import { create } from "domain";
import { EventEmitter } from "stream";
import cloudinary from "~/server/cloudinary";
import axios from "axios";
import fs from "fs";

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
      console.log("");
      console.log(
        "FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
      );
      console.log("");
      let new_message = input.message;
      if (input.message.startsWith("blob:http")) {
        try {
          const response = await fetch(input.message);
          const imageBuffer = await response.arrayBuffer();

          // Save the image to a temporary local file
          const tempImagePath = "./temporary/image.jpg"; // Path to a temporary directory on your Mac
          fs.writeFileSync(tempImagePath, Buffer.from(imageBuffer));

          // Upload the image to Cloudinary
          cloudinary.uploader.upload(
            tempImagePath,
            { public_id: "hey_man" },
            function (error, result) {
              // Clean up the temporary image file
              fs.unlinkSync(tempImagePath);

              if (error) {
                console.error("Error uploading to Cloudinary:", error);
                return;
              }
              console.log("Image uploaded to Cloudinary:", result?.secure_url);
              new_message = result?.secure_url!;
            }
          );
        } catch (error) {
          console.error("Error downloading image:", error);
        }
      }
      const { result: message } = await handleDuration(
        ctx.prisma.message.create({
          data: {
            message: new_message,
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
