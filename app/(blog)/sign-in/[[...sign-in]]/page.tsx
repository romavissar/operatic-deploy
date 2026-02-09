import { SignIn } from "@clerk/nextjs";
import { SignInFallback } from "@/components/SignInFallback";

export default function SignInPage() {
  return (
    <div className="flex justify-center py-12">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#0a0a0a",
            colorBackground: "#ffffff",
            colorText: "#0a0a0a",
            colorTextSecondary: "rgba(10,10,10,0.8)",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontWeight: {
              normal: "300",
              medium: "400",
              bold: "500",
            },
            borderRadius: "0.75rem",
          },
          elements: {
            rootBox: "w-full max-w-md",
            card: "shadow-none",
            headerTitle: "font-light tracking-tight",
            headerSubtitle: "font-light text-foreground/80",
            socialButtonsBlockButton: "font-light rounded-xl",
            formFieldLabel: "font-light",
            formFieldInput: "font-light rounded-xl",
            formButtonPrimary: "font-light rounded-xl",
            footerActionLink: "font-light",
            identityPreviewEditButton: "font-light",
          },
        }}
        afterSignInUrl="/"
      />
      <SignInFallback />
    </div>
  );
}
