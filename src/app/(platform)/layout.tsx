import { PlatformShell } from '@/components/layout';

// In a real app, this would come from session/auth
const mockUser = {
  name: 'John Smith',
  email: 'john@acmebank.com',
  role: 'Admin',
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformShell user={mockUser}>{children}</PlatformShell>;
}
