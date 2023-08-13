import { createTRPCRouter } from "~/server/api/trpc";
import { chatsRouter } from "./routers/chats";
import { usersRouter } from "./routers/users";
import { messagesRouter } from "./routers/messages";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  chats: chatsRouter,
  users: usersRouter,
  messages: messagesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
