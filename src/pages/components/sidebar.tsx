import {
  RedirectToUserProfile,
  SignIn,
  SignInButton,
  SignOutButton,
  UserButton,
  clerkClient,
  useUser,
} from "@clerk/nextjs";
import { User } from "@clerk/nextjs/dist/types/server";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "~/utils/api";
import LoadingSpinner from "./loading";
import Image from "next/image";
import { toast } from "react-hot-toast";

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

export type currentChatProps = {
  currentChat: Chat;
  setCurrentChat: Dispatch<SetStateAction<Chat>>;
};

const Sidebar = (props: currentChatProps) => {
  const { user: currentUser } = useUser();
  if (!currentUser) {
    return <LoadingSpinner />;
  }

  const currentChat = props.currentChat;

  const [foundedUsers, setFoundedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { data: users, isLoading: usersLoading } =
    api.users.getAllUsers.useQuery();

  const ctx = api.useContext();

  const { data: chats } = api.chats.getAllById.useQuery({
    id: currentUser.id,
  });

  // create a new chat
  const { mutate, isLoading, error, data } = api.chats.create.useMutation({
    onSuccess: () => {
      toast.success(`A new chat with ${data?.user2_name}`);
      void ctx.chats.invalidate();
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
      className={`flex h-screen w-full ${
        currentChat.id && "hidden md:flex"
      } flex-col border md:w-1/2`}
    >
      <div className="flex items-center justify-between p-5">
        {/* <i className="fa-solid fa-bars"></i> */}
        <UserButton afterSignOutUrl="/" />
        <div className="flex w-5/6 items-center space-x-4 rounded-full border px-4 py-3">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            className="w-full outline-none"
            type="text"
            placeholder="Search | @ to find users"
            onChange={(e) => {
              handleUserSearch(e);
            }}
          />
        </div>
      </div>
      <div className="flex w-full justify-evenly">
        <div className="border-b border-slate-400">All</div>
        <div>Privacy</div>
        <div>New messages</div>
      </div>

      <hr className="my-4" />

      <div className=" w-full">
        {/* {usersLoading && <LoadingSpinner />} */}
        {foundedUsers.map((user) => {
          return (
            <div key={user.id}>
              <div className="mx-4 my-2 w-fit text-slate-500">Users</div>
              <div className="flex w-fit items-center space-x-6 p-4">
                <div>
                  <Image
                    width="56"
                    height="56"
                    src={user.imageUrl}
                    alt="userImage"
                    className="rounded-full"
                  />
                </div>
                <div className="text-lg">{user.firstName}</div>
                <div
                  className="bold italic hover:underline"
                  onClick={() => createChat(user)}
                >
                  start chatting
                </div>
              </div>
              <hr />
            </div>
          );
        })}
      </div>

      {isSearching && (
        <div className="mx-4 my-2 w-fit text-slate-500">Chats</div>
      )}

      <div className="flex flex-col">
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
                key={chat.id}
                className="mx-2 flex justify-between rounded-xl p-2 hover:bg-slate-100"
              >
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
                    <div>{chatInfo.chat_name}</div>
                    <div className="font-light text-gray-500">message</div>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-1 p-1">
                  <div className="pr-2 text-xs font-light text-gray-500">
                    15:43
                  </div>
                  <div className="rounded-full bg-green-500 px-2 text-white">
                    1
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
