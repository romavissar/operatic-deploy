export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {children}
    </main>
  );
}
