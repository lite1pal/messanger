import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";

import {
  ClerkProvider,
  RedirectToSignIn,
  SignIn,
  SignedIn,
  SignedOut,
  useAuth,
} from "@clerk/nextjs";
import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";

import { date } from "zod";
import { dark } from "@clerk/themes";
import { useState } from "react";

const MyApp: AppType = ({ Component, pageProps }) => {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ClerkProvider
      appearance={{
        layout: {
          helpPageUrl: "https://clerk.com/support",

          logoImageUrl: "https://clerk.com/logo.png",

          logoPlacement: "inside",

          privacyPageUrl: "https://clerk.com/privacy",

          showOptionalFields: true,

          socialButtonsPlacement: "bottom",

          socialButtonsVariant: "iconButton",

          termsPageUrl: "https://clerk.com/terms",
        },
        variables: {
          colorPrimary: darkMode ? "white" : "black",
          colorText: darkMode ? "white" : "black",
        },
        baseTheme: darkMode ? dark : undefined,
      }}
      {...pageProps}
    >
      <SignedIn>
        <Component {...{ darkMode, setDarkMode }} />
        <div>
          <Toaster />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <script
        src="https://kit.fontawesome.com/ce54b8dfe1.js"
        crossOrigin="anonymous"
      ></script>
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
