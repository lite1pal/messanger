import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import Sidebar, { Chat } from "./components/sidebar";
import Chatroom from "./components/chatroom";
import { SignIn, SignInButton, useUser } from "@clerk/clerk-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function Home({
  darkMode,
  setDarkMode,
}: {
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
}) {
  const [currentChat, setCurrentChat] = useState<Chat>({
    id: "",
    user1_id: "",
    user1_name: "",
    user1_imageUrl: "",
    user2_id: "",
    user2_name: "",
    user2_imageUrl: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [isOnline, setIsOnline] = useState(false);
  // const [darkMode, setDarkMode] = useState(false);
  const socket = io("http://localhost:4000"); // Replace with the correct URL where your Socket.io server is running

  return (
    <div className={`${darkMode && "dark"} flex w-screen`}>
      <Sidebar
        {...{
          currentChat,
          setCurrentChat,
          socket,
          darkMode,
          setDarkMode,
          isOnline,
        }}
      />

      <div
        className={`${
          currentChat.id && "md:hidden"
        } hidden h-screen w-full bg-green-200 dark:bg-gradient-to-r dark:from-stone-900 dark:to-stone-700
         md:flex`}
      ></div>

      <Chatroom
        {...{
          currentChat,
          setCurrentChat,
          socket,
          darkMode,
          setDarkMode,
          isOnline,
        }}
      />
    </div>
  );
}
