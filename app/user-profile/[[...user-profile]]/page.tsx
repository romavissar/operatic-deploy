import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <UserProfile
      routing="path"
      path="/user-profile"
      appearance={{
        elements: {
          rootBox: "w-full max-w-none",
          card: "w-full max-w-none shadow-none rounded-none",
          navbar: "w-full max-w-none",
          pageScrollBox: "w-full max-w-none flex-1",
        },
      }}
    />
  );
}
