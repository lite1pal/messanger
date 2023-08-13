import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import LoadingSpinner from "./loading";
import { Chat, Props } from "./sidebar";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import {
  CldUploadButton,
  CldImage,
  CldUploadWidgetResults,
} from "next-cloudinary";

// formats time from default Date time to hour:minutes type
export const formatTime = (time: Date) => {
  return new Date(time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export interface Message {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  message: string;
  imageId: string;
  chat_id: string;
  user_id: string;
}

type CldUploadSuccess = {
  event: string;
  info: {
    public_id: string;
  };
};

const Chatroom = (props: Props) => {
  // gets info about current user using clerk API
  const { user: currentUser } = useUser();

  // returns LoadingSpinner if current use is still null
  if (!currentUser) return <LoadingSpinner />;

  // react state
  const [messageInput, setMessageInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [chatOptionsVision, setChatOptionsVision] = useState(false);
  const [emojiPickerVision, setEmojiPickerVision] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // refs
  const divRef = useRef<HTMLDivElement>(null);

  // API context
  const ctx = api.useContext();

  // props
  const { currentChat, socket, darkMode, setDarkMode } = props;

  // fetches a list of messages from the server based on currentChat
  const { data: messages, isLoading: messagesLoading } =
    api.messages.getAllByChatId.useQuery({
      chat_id: currentChat.id,
    });

  // determines name and imageUrl of current chat
  const chat =
    currentChat.user1_id === currentUser.id
      ? { name: currentChat.user2_name, imageUrl: currentChat.user2_imageUrl }
      : { name: currentChat.user1_name, imageUrl: currentChat.user1_imageUrl };

  // handles a vision of chat options at the top of the chatroom when an options button is clicked
  const handleChatOptionsVision = (boolean: boolean) => {
    if (chatOptionsVision) {
      setChatOptionsVision(false);
    } else {
      setChatOptionsVision(true);
    }
  };

  // handles a vision of emoji picker beside message input when a smile button is clicked
  const handleEmojiPickerVision = (boolean: boolean) => {
    if (emojiPickerVision) {
      setEmojiPickerVision(false);
    } else {
      setEmojiPickerVision(true);
    }
  };

  // hides a chatroom ( but only in case if any chat is opened) when Escape button is clicked
  useEffect(() => {
    const handleEscapeKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.setCurrentChat((prevChat) => ({
          ...prevChat,
          id: "",
        }));
        setChatOptionsVision(false);
        setEmojiPickerVision(false);
      }
    };

    // Removes the previous event listener before adding a new one
    document.removeEventListener("keydown", handleEscapeKeyPress);
    document.addEventListener("keydown", handleEscapeKeyPress);

    // Cleans up function to remove the event listener on unmount
    return () => {
      document.removeEventListener("keydown", handleEscapeKeyPress);
    };
  }, [currentChat.id]);

  // listens for an event from the socket to make a data change in real-time
  useEffect(() => {
    socket.on("send_message", () => {
      // makes requests to sync up with messages and chats from the database to the front-end
      void ctx.messages.invalidate();
      void ctx.chats.invalidate();
    });
  }, []);

  // gets mutate function that can be use to create a new message
  const { mutate, isLoading: sendingMessageLoading } =
    api.messages.create.useMutation({
      // in case of successfully created message, this callback function is invoked
      onSuccess: () => {
        // only users that belong to this chat must see the change in real-time
        if (
          currentUser.id === currentChat.user1_id ||
          currentUser.id === currentChat.user2_id
        ) {
          // emits necessary data to the server in order to update messages in real-time for both users
          socket.emit("send_message", {
            user_id: currentUser.id,
            chat_id: currentChat.id,
            message: messageInput.length > 0 ? messageInput : "empty",
            imageId: imageInput,
            createdAt: new Date(),
          });

          // CAN BE REMOVED
          void ctx.messages.invalidate();
        }
        // clears message input
        setMessageInput("");
        setImageInput("");
        setIsSendingMessage(false);
      },
      // if error occurs, this callback function is invoked
      onError: (err) => {
        console.error(err.message);
        toast.error(err.message);
      },
    });

  // clears message input
  const clearMessageInput = () => {
    const messageInputElement = document.getElementById(
      "messageInput"
    ) as HTMLInputElement;
    if (messageInputElement && messageInputElement.value) {
      messageInputElement.value = "";
    }
  };

  // sends a message
  const sendMessage = async (e: any) => {
    if (
      // input must not be empty and Enter must be clicked to send a message
      e.target.value.length > 0 &&
      e.key === "Enter"
    ) {
      setIsSendingMessage(true);

      // tries to create a message
      mutate({
        user_id: currentUser.id,
        chat_id: currentChat.id,
        message: e.target.value,
        imageId: "empty",
      });
      // tries to update a chat
      update({
        id: currentChat.id,
        last_message: e.target.value,
        last_message_createdAt: new Date(),
      });
      setMessageInput(e.target.value);
      setEmojiPickerVision(false);

      // NEED TO BE CHANGED AS IT IS NOT THE BEST PRACTICE IN REACT
      // clears up message input
      clearMessageInput();
    }
  };

  const uploadImage = (result: CldUploadSuccess) => {
    if (result.info.public_id && currentUser.id && currentChat.id) {
      setImageInput(result.info.public_id);
      mutate({
        user_id: currentUser.id,
        chat_id: currentChat.id,
        message: "empty",
        imageId: result.info.public_id,
      });
      clearMessageInput();
      toast.success("Upload is successful");
    } else {
      toast.error(
        "Something went wrong when uploading an image, try again a bit later"
      );
    }
  };

  // gets mutate func to delete a chat
  const { mutate: deleteChat } = api.chats.delete.useMutation({
    onSuccess: () => {
      void ctx.chats.invalidate();

      // sets current chat id to empty string and therefore hides the chatroom
      props.setCurrentChat({ ...currentChat, id: "" });
      setChatOptionsVision(false);
    },
    onError: (err) => {
      console.error(err.message);
      toast.error(err.message);
    },
  });

  // gets mutate func to delete a message
  const { mutate: deleteMessage } = api.chats.delete.useMutation({
    onSuccess: () => {
      void ctx.messages.invalidate();
      void ctx.chats.invalidate();
    },
    onError: (err) => {
      console.error(err.message);
      toast.error(err.message);
    },
  });

  // gets mutate func to update a chat when a new message is created
  const { mutate: update } = api.chats.update.useMutation({
    onSuccess: () => {
      void ctx.chats.invalidate();
      console.log("chats are updated");
    },
    onError: (err) => {
      console.error(err.message);
      toast.error(err.message);
    },
  });

  // NEEDS TO BE UPDATED BECAUSE IF A SUDDEN RENDER OCCURS, IT MOVES IT TO THE BOTTOM EVEN IF YOU SCROLLED TO THE MIDDLE OF THE CONVERSATION
  // set a scroll of the chatroom to the bottom when a message is sent
  useEffect(() => {
    if (divRef.current) {
      divRef.current.scrollTop = divRef.current.scrollHeight;
    }
  }, [messages]);

  // renders actual chatroom component
  return (
    <div
      className={`${
        !currentChat.id && "hidden"
      } flex h-screen w-full flex-col transition duration-700`}
    >
      {/* Chatroom's header */}

      <div className="flex h-fit w-full items-center justify-between border-b px-2 py-2 dark:border-0 dark:border-stone-700 dark:bg-stone-900 md:px-6">
        <div
          onClick={() => props.setCurrentChat({ ...currentChat, id: "" })}
          className={`rounded-full px-2 py-1 transition duration-200 hover:bg-slate-200 dark:hover:bg-stone-600 md:hidden`}
          style={darkMode ? { color: "gray" } : {}}
        >
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <div className="flex space-x-2 md:space-x-4">
          <div>
            {chat.imageUrl && (
              <Image
                className="rounded-full"
                width="42"
                height="42"
                src={chat.imageUrl}
                alt="chatImage"
              />
            )}
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-semibold dark:text-white sm:text-base">
              {chat.name}
            </div>
            <div className="text-sm font-light text-slate-500 dark:text-slate-400">
              last seen recently
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 md:space-x-8">
          <div className="pointer-events-none rounded-full px-2 py-1 opacity-0 transition duration-300 hover:bg-slate-200 dark:hover:bg-stone-600">
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ color: "gray" }}
            ></i>
          </div>
          <div
            onClick={() => handleChatOptionsVision(true)}
            className="rounded-full px-2 py-1 transition duration-300 hover:bg-slate-200 dark:hover:bg-stone-600"
          >
            <i className="fa-solid fa-gears" style={{ color: "gray" }}></i>
          </div>
          <div
            className={`${
              !chatOptionsVision && "pointer-events-none opacity-0"
            } absolute right-6 top-16 flex w-2/12 flex-col space-y-1 bg-slate-50 bg-opacity-95 p-2 text-sm transition dark:bg-stone-900 dark:text-white`}
          >
            {/* <div className="flex items-center space-x-4 rounded-full p-2 hover:bg-slate-200 dark:hover:bg-stone-700">
              <div>
                <i className="fa-solid fa-pen-to-square"></i>
              </div>
              <div>Edit</div>
            </div>
            <div className="flex items-center space-x-3 rounded-full p-2 hover:bg-slate-200 dark:hover:bg-stone-700">
              <div>
                <i className="fa-solid fa-bell-slash"></i>
              </div>
              <div>Mute</div>
            </div> */}
            {/* <hr className="dark:opacity-30" /> */}
            <div
              onClick={() => {
                deleteChat({ id: currentChat.id });
              }}
              className="flex items-center space-x-4 rounded-full p-2 text-red-500 hover:bg-slate-200 dark:hover:bg-stone-700"
            >
              <div>
                <i className="fa-solid fa-trash"></i>
              </div>
              <div>Delete chat</div>
            </div>
          </div>
        </div>
      </div>

      {/*   Body of chatroom where messages and message input are   */}

      <div
        onClick={() => {
          setChatOptionsVision(false);
        }}
        className="flex h-5/6 flex-grow flex-col items-center justify-between bg-green-200 dark:bg-gradient-to-r dark:from-stone-800 dark:to-stone-700"
      >
        {messagesLoading && messages === undefined && (
          <div className="relative top-1/3">
            <LoadingSpinner />
          </div>
        )}
        {messages !== undefined && messages.length === 0 && (
          <div className="relative top-1/3 font-light text-slate-600 dark:text-slate-300">
            Come on, start a conversation
          </div>
        )}
        <div
          ref={divRef}
          className="flex h-5/6 w-full flex-grow flex-col items-center overflow-scroll"
        >
          {messages?.map((message, index) => {
            const messageRight =
              currentUser.id === message.user_id ? true : false;

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
                  <div className="my-5 border-b border-slate-900 font-light text-slate-700 dark:border-slate-300 dark:text-white">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </div>
                )}
                <div
                  className={`flex w-full justify-between px-8 py-1 max-sm:px-2 lg:w-4/6`}
                >
                  <div
                    className={`pointer-events-none opacity-0 ${
                      !messageRight && "hidden"
                    }`}
                  >
                    h
                  </div>
                  {message.imageId && message.imageId !== "empty" ? (
                    <div className="rounded border-gray-400">
                      <CldImage
                        width="400"
                        height="400"
                        src={message.imageId}
                        sizes="100vw"
                        alt="Description of my image"
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex w-fit items-center justify-between space-x-3 rounded-xl ${
                        !messageRight && "bg-white dark:bg-stone-700"
                      }  bg-green-400 px-2 py-1 dark:bg-purple-600`}
                    >
                      <div className="dark:text-white">{message.message}</div>
                      <div className="mt-2 text-xs font-light text-slate-500 dark:text-slate-200">
                        {formattedTime}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })}
        </div>

        {/*   Message input with emoji picker  */}

        <div className="flex h-max w-full items-center space-x-3 px-8 py-3 lg:w-4/6">
          <div
            className={`${!emojiPickerVision && "hidden"} absolute bottom-20`}
          >
            <EmojiPicker
              onEmojiClick={(obj) => {
                setMessageInput((prevMessage) => prevMessage + obj.emoji);
                const messageInputElement = document.getElementById(
                  "messageInput"
                ) as HTMLInputElement;
                messageInputElement.value =
                  messageInputElement.value + obj.emoji;
                messageInputElement.focus();
              }}
              lazyLoadEmojis={true}
              width="auto"
              height={400}
              searchDisabled={true}
            />
          </div>
          <div className="flex w-11/12 justify-between rounded-xl bg-white p-4 dark:bg-stone-800">
            <div className="flex w-full items-center space-x-4">
              <i
                onClick={() => handleEmojiPickerVision(true)}
                className="fa-solid fa-face-smile fa-lg"
                style={{ color: "gray" }}
              ></i>
              <input
                className="w-10/12 text-sm outline-none dark:bg-stone-800 dark:text-white"
                type="text"
                placeholder="Message"
                onKeyDown={sendMessage}
                onClick={() => setEmojiPickerVision(false)}
                id="messageInput"
              />
            </div>

            <div className="text-sm font-medium text-slate-500 dark:text-slate-300">
              <CldUploadButton
                onUpload={(opts) => {
                  const result = opts as CldUploadSuccess;
                  uploadImage(result);
                }}
                onClose={(widget) => {
                  widget.destroy();
                }}
                uploadPreset="mdp1ypb6"
              />
            </div>
          </div>

          {/*   Microphone   */}

          {/* <div className="rounded-full bg-white px-5 py-3 transition duration-300 hover:bg-blue-500 dark:bg-stone-800 dark:hover:bg-purple-600 ">
            <i
              className="fa-solid fa-microphone fa-lg"
              style={{ color: "gray" }}
            ></i>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Chatroom;
