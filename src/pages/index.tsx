import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import Sidebar, { Chat } from "./components/sidebar";
import Chatroom from "./components/chatroom";
import { SignIn, SignInButton, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export default function Home() {
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

  useEffect(() => {
    const handleEscapeKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCurrentChat((prevChat) => ({
          ...prevChat,
          id: "", // For example, reset the currentChat.id to null
        }));
      }
    };

    // Remove the previous event listener before adding a new one
    document.removeEventListener("keydown", handleEscapeKeyPress);
    document.addEventListener("keydown", handleEscapeKeyPress);

    // Cleanup function to remove the event listener on unmount
    return () => {
      document.removeEventListener("keydown", handleEscapeKeyPress);
    };
  }, [currentChat.id]);

  return (
    <div className="flex w-screen">
      <Sidebar {...{ currentChat, setCurrentChat }} />

      <div
        className={`${
          currentChat.id && "md:hidden"
        } hidden h-screen w-full bg-green-200 md:flex`}
      ></div>

      <Chatroom {...{ currentChat, setCurrentChat }} />
    </div>
  );
}
