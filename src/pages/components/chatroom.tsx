import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import LoadingSpinner from "./loading";
import { currentChatProps } from "./sidebar";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { FormEvent, useEffect, useRef, useState } from "react";

const Chatroom = (props: currentChatProps) => {
  const { user: currentUser } = useUser();
  if (!currentUser) return <LoadingSpinner />;
  const [messageInput, setMessageInput] = useState("");
  const divRef = useRef<HTMLDivElement>(null);
  const ctx = api.useContext();
  const currentChat = props.currentChat;
  const chat =
    currentChat.user1_id === currentUser.id
      ? { name: currentChat.user2_name, imageUrl: currentChat.user2_imageUrl }
      : { name: currentChat.user1_name, imageUrl: currentChat.user1_imageUrl };

  const {
    data: messages,
    isLoading: messagesLoading,
    refetch,
  } = api.messages.getAllByChatId.useQuery({
    chat_id: currentChat.id,
  });

  if (messages === undefined) return <LoadingSpinner />;

  // send a message in the chat
  const {
    mutate,
    mutateAsync,
    isLoading: sendingMessageLoading,
  } = api.messages.create.useMutation({
    onSuccess: () => {
      void ctx.messages.invalidate();
    },
    onError: (err) => {
      console.error(err.message);
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (divRef.current) {
      divRef.current.scrollTop = divRef.current.scrollHeight;
    }
  }, [messages]);

  const updateMessageInput = (e: any) => {
    setMessageInput(e.target.value);
  };

  const sendMessage = async (e: any) => {
    if (e.target.value.length > 0 && e.key === "Enter") {
      setMessageInput("");

      mutate({
        user_id: currentUser.id,
        chat_id: currentChat.id,
        message: messageInput,
      });

      // setTimeout(() => {
      //   const divElement = divRef.current;
      //   divElement.scrollTop = divElement.scrollHeight;
      // }, 500);
    }
  };

  const shouldShowDateHeader = (currentIndex: number): boolean => {
    if (currentIndex === 0) {
      // Show the date header for the first message
      return true;
    }

    const currentMessageDate = new Date(
      messages[currentIndex]?.createdAt!
    ).toLocaleDateString();
    const prevMessageDate = new Date(
      messages[currentIndex - 1]?.createdAt!
    ).toLocaleDateString();

    // Compare the current message date with the previous message date
    return currentMessageDate !== prevMessageDate;
  };

  return (
    <div
      className={`${
        !currentChat.id && "hidden"
      } flex h-screen w-full flex-col transition duration-700`}
    >
      <div className="flex h-fit w-full items-center justify-between border-b px-2 py-2 md:px-6">
        <div
          onClick={() => props.setCurrentChat({ ...currentChat, id: "" })}
          className={`rounded-full px-2 py-1 transition duration-200 hover:bg-slate-200 md:hidden`}
        >
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <div className="flex space-x-2 md:space-x-4">
          <div>
            <Image
              className="rounded-full"
              width="42"
              height="42"
              src={chat.imageUrl}
              alt="chatImage"
            />
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-semibold sm:text-base">
              {chat.name}
            </div>
            <div className="text-sm font-light text-slate-500">
              last seen recently
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 md:space-x-8">
          <div className="rounded-full px-2 py-1 transition duration-300 hover:bg-slate-200">
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ color: "gray" }}
            ></i>
          </div>
          <div className="rounded-full px-2 py-1 transition duration-300 hover:bg-slate-200">
            <i className="fa-solid fa-gears" style={{ color: "gray" }}></i>
          </div>
        </div>
      </div>
      <div className="flex h-5/6 flex-grow flex-col items-center justify-between bg-green-200">
        {messagesLoading && (
          <div className="relative top-1/3">
            <LoadingSpinner />
          </div>
        )}
        <div
          ref={divRef}
          className="flex h-5/6 w-full flex-grow flex-col items-center overflow-scroll"
        >
          {messages?.map((message, index) => {
            const messageRight =
              currentUser.id === message.user_id ? true : false;

            const formattedTime = new Date(
              message.createdAt
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

            return (
              <>
                {shouldShowDateHeader(index) && (
                  <div className="my-5 border-b border-slate-900 font-light text-slate-700">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </div>
                )}
                <div
                  className={`flex w-full justify-between px-8 py-1 lg:w-4/6`}
                >
                  <div
                    className={`pointer-events-none opacity-0 ${
                      !messageRight && "hidden"
                    }`}
                  >
                    h
                  </div>
                  <div
                    className={`flex w-fit items-center justify-between space-x-3 rounded-xl ${
                      !messageRight && "bg-white"
                    }  bg-green-400 px-2 py-1`}
                  >
                    <div>{message.message}</div>
                    <div className="mt-2 text-xs font-light text-slate-500">
                      {formattedTime}
                    </div>
                  </div>
                </div>
              </>
            );
          })}
        </div>

        <div className="flex h-max w-full items-center space-x-3 px-8 py-3 lg:w-4/6">
          <div className="flex w-11/12 justify-between rounded-xl bg-white p-4">
            <div className="flex w-full items-center space-x-4">
              <i
                className="fa-solid fa-face-smile fa-lg"
                style={{ color: "gray" }}
              ></i>
              <input
                className="w-10/12 text-sm outline-none"
                type="text"
                placeholder="Message"
                onChange={updateMessageInput}
                onKeyDown={sendMessage}
                value={messageInput}
              />
            </div>
            <div>
              <i
                className="fa-solid fa-paperclip fa-lg"
                style={{ color: "gray" }}
              ></i>
            </div>
          </div>
          <div className="rounded-full bg-white px-5 py-3 transition duration-300 hover:bg-blue-500 ">
            <i
              className="fa-solid fa-microphone fa-lg"
              style={{ color: "gray" }}
            ></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatroom;
