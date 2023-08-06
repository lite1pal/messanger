import { UserButton, useUser } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/dist/types/server";
import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import { api } from "~/utils/api";
import LoadingSpinner from "./loading";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { formatTime } from "./chatroom";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { dark } from "@clerk/themes";

export type Chat = {
  id: string;
  user1_id: string;
  user1_name: string;
  user1_imageUrl: string;
  user2_id: string;
  user2_name: string;
  user2_imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Props = {
  currentChat: Chat;
  setCurrentChat: Dispatch<SetStateAction<Chat>>;
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
  isOnline: boolean;
};

const Sidebar = (props: Props) => {
  const { user: currentUser } = useUser();
  if (!currentUser) {
    return <LoadingSpinner />;
  }

  const currentChat = props.currentChat;
  const { darkMode, setDarkMode } = props;

  const [foundedUsers, setFoundedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [chatContextVision, setChatContextVision] = useState(false);
  const { isOnline } = props;

  const { data: users, isLoading: usersLoading } =
    api.users.getAllUsers.useQuery();

  const ctx = api.useContext();

  const { data: chats } = api.chats.getAllById.useQuery({
    id: currentUser.id,
  });

  // handle a dark mode switching
  const handleDarkModeSwitch = () => {
    if (darkMode) {
      setDarkMode(false);
    } else {
      setDarkMode(true);
    }
  };

  // create a new chat
  const {
    mutate,
    isLoading: creatingChat,
    error,
    data,
  } = api.chats.create.useMutation({
    onSuccess: () => {
      ctx.chats.invalidate().then(() => {
        toast.success(`A new chat created`);
      });
    },
    onError: (err) => {
      console.error(err.message);
      toast.error(err.message);
    },
  });

  const createChat = (user: User) => {
    if (currentUser.id === user.id) {
      return toast.error("You are not allowed to create a chat with yourself");
    }
    const isChatAlready = chats?.some((chat) => {
      return chat.user1_id === user.id || chat.user2_id === user.id;
    });

    if (isChatAlready) {
      return toast.error("You are already in a chat with this user");
    }
    if (currentUser && currentUser.firstName && user.firstName) {
      mutate({
        user1_id: currentUser.id,
        user1_name: currentUser.firstName,
        user1_imageUrl: currentUser.imageUrl,
        user2_id: user.id,
        user2_name: user.firstName,
        user2_imageUrl: user.imageUrl,
      });
    }
  };

  // delete a chat
  const { mutate: deleteChat } = api.chats.delete.useMutation({
    onSuccess: () => {
      void ctx.chats.invalidate();
      props.setCurrentChat({ ...currentChat, id: "" });
      setChatContextVision(false);
    },
    onError: (err) => {
      console.error(err.message);
      toast.error(err.message);
    },
  });

  // search for users
  const handleUserSearch = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length === 0) {
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
    if (e.target.value.length <= 1) {
      setFoundedUsers([]);
      return;
    }
    if (users && e.target.value.startsWith("@") && e.target.value.length > 1) {
      const input = e.target.value.substring(1);
      const result = users.filter((user) => {
        return user.firstName!.toLowerCase().includes(input.toLowerCase());
      });
      setFoundedUsers(result);
    }
  };

  return (
    <div
      onClick={() => setChatContextVision(false)}
      className={`flex h-screen w-full ${
        currentChat.id && "hidden md:flex"
      } flex-col border dark:border-stone-800 dark:bg-stone-900 md:w-1/2`}
    >
      <div className="flex items-center justify-between space-x-1 p-5">
        {/* <i className="fa-solid fa-bars"></i> */}
        <UserButton afterSignOutUrl="/" />
        {isOnline && <div>Online</div>}
        <div
          onClick={handleDarkModeSwitch}
          className="rounded-full px-2 py-1 transition hover:bg-slate-300 dark:hover:bg-stone-600"
        >
          {darkMode ? (
            <i
              className="fa-solid fa-lightbulb"
              style={{ color: "yellow" }}
            ></i>
          ) : (
            <i className="fa-solid fa-moon fa-lg"></i>
          )}
        </div>
        <div className="flex w-5/6 items-center space-x-4 rounded-full border px-4 py-3 dark:border-0 dark:bg-stone-800">
          <i
            className="fa-solid fa-magnifying-glass"
            style={darkMode ? { color: "gray" } : {}}
          ></i>
          <input
            className="w-full outline-none dark:bg-stone-800 dark:text-white"
            type="text"
            placeholder="Search | @ to find users"
            onChange={(e) => {
              handleUserSearch(e);
            }}
          />
        </div>
      </div>
      <div className="flex w-full justify-evenly dark:text-slate-400">
        <div className="border-b border-slate-400">All</div>
        <div>Privacy</div>
        <div>New messages</div>
      </div>

      <hr className="my-4 dark:opacity-30" />

      <div className=" w-full">
        {/* {usersLoading && <LoadingSpinner />} */}
        {foundedUsers.map((user) => {
          return (
            <div key={user.id}>
              <div className="mx-4 my-2 w-fit text-slate-500">Users</div>
              <div className="flex w-4/6 items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div>
                    <Image
                      width="42"
                      height="42"
                      src={user.imageUrl}
                      alt="userImage"
                      className="rounded-full"
                    />
                  </div>
                  <div className="mb-4 text-sm dark:text-white">
                    {user.firstName}
                  </div>
                </div>
                <div
                  className=" cursor-pointer text-slate-700 transition hover:animate-pulse dark:text-slate-300"
                  onClick={() => {
                    createChat(user);
                  }}
                >
                  start a chat
                </div>
              </div>
              <hr className="dark:opacity-30" />
            </div>
          );
        })}
      </div>

      {isSearching && (
        <div className="mx-4 my-2 w-fit text-slate-500">Chats</div>
      )}

      <div className="flex flex-col">
        {chats !== undefined && chats.length === 0 && (
          <div className="flex flex-col items-center space-y-3 p-5 text-slate-600 dark:text-slate-300">
            <div>No chats yet.</div>
            <div>Find someone to talk with in the search bar above</div>
          </div>
        )}
        {!chats || !users ? (
          <LoadingSpinner />
        ) : (
          chats.map((chat) => {
            const chatInfo =
              currentUser.id === chat.user1_id
                ? { chat_name: chat.user2_name, imageUrl: chat.user2_imageUrl }
                : { chat_name: chat.user1_name, imageUrl: chat.user1_imageUrl };
            return (
              <div
                onClick={() => props.setCurrentChat(chat)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setChatContextVision(true);
                }}
                key={chat.id}
                className={`${
                  currentChat.id === chat.id
                    ? "bg-blue-500 text-white hover:bg-blue-500 dark:bg-purple-600 dark:hover:bg-purple-600"
                    : "hover:bg-slate-200 dark:hover:bg-stone-800"
                } mx-2 flex justify-between rounded-xl p-2`}
              >
                <div
                  className={`${
                    !chatContextVision && "pointer-events-none opacity-0"
                  } absolute left-16 flex w-fit cursor-default flex-col space-y-1 rounded bg-slate-50 text-sm transition dark:bg-stone-900 dark:text-white`}
                >
                  <div
                    // onClick={() => {}}
                    onClick={() => {
                      deleteChat({ id: currentChat.id });
                    }}
                    className="flex items-center space-x-4 rounded p-4 text-red-500 hover:bg-slate-200 dark:hover:bg-stone-700"
                  >
                    <div>
                      <i className="fa-solid fa-trash"></i>
                    </div>
                    <div>Delete chat</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div>
                    <Image
                      className="rounded-full"
                      width="56"
                      height="56"
                      src={chatInfo.imageUrl}
                      alt="chatImage"
                    />
                  </div>
                  <div>
                    <div className="dark:text-white">{chatInfo.chat_name}</div>
                    <div
                      className={`${
                        currentChat.id === chat.id && "text-white"
                      } font-light text-gray-500 dark:text-gray-300`}
                    >
                      {chat.last_message}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-1 p-1">
                  <div
                    className={`${
                      currentChat.id === chat.id && "text-white dark:text-white"
                    } pr-2 text-xs font-light text-gray-500 dark:text-gray-400`}
                  >
                    {formatTime(chat.last_message_createdAt)}
                  </div>
                  <div className="rounded-full bg-green-700 px-2 text-white">
                    3
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar;
