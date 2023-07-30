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

const MyApp: AppType = ({ Component, pageProps }) => {
  const router = useRouter();

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
          colorPrimary: "black",

          colorText: "black",
        },
      }}
      {...pageProps}
    >
      <SignedIn>
        <Component {...pageProps} />
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
