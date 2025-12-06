import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="h-16 px-6 flex items-center border-b border-zinc-200 bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">LoanOS</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-zinc-500">
        <p>&copy; 2024 LoanOS. All rights reserved.</p>
      </footer>
    </div>
  );
}
