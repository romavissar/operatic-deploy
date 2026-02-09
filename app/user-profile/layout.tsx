export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="user-profile-page min-h-screen w-full py-8">
      {children}
    </main>
  );
}
