export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}

