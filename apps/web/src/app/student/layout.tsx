export default function StudentRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-slate-200/60">
      <div className="mx-auto min-h-dvh max-w-md bg-white md:shadow-2xl">
        {children}
      </div>
    </div>
  );
}
