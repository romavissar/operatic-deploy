import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Header } from "@/components/Header";
import { SimpleHeader } from "@/components/SimpleHeader";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "operatic",
  description: "A minimal blog",
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = (
    <>
      {clerkPublishableKey ? <Header /> : <SimpleHeader />}
      {children}
    </>
  );

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans font-light tracking-tight antialiased text-foreground bg-background">
        {clerkPublishableKey ? (
          <ClerkProvider
            publishableKey={clerkPublishableKey}
            signInUrl="/sign-in"
            signInForceRedirectUrl="/"
            signUpForceRedirectUrl="/"
            appearance={{
              layout: {
                showOptionalClerkBadge: false,
              } as { showOptionalClerkBadge?: boolean },
            }}
          >
            {body}
          </ClerkProvider>
        ) : (
          body
        )}
      </body>
    </html>
  );
}
