export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-orange-600">🍽️ Smart Canteen</h1>
        <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          College canteen ordering with QR pickup
        </p>
        {children}
      </div>
    </div>
  );
}
