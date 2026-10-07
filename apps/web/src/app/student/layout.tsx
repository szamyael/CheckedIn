export default function StudentRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="student-auth-shell min-h-dvh px-0 md:px-6">
      <div className="mx-auto min-h-dvh max-w-5xl bg-[var(--background)] shadow-2xl md:border-x md:border-[var(--border)]">
        {children}
      </div>
    </div>
  );
}
