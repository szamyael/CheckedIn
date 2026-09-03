export default function StudentRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#dfe6e5] px-0 md:px-6">
      <div className="mx-auto min-h-dvh max-w-5xl bg-[#f6f7f5] shadow-2xl md:border-x md:border-[#e2e5e7]">
        {children}
      </div>
    </div>
  );
}
