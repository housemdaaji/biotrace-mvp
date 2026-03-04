import AuthGuard from '@/components/AuthGuard';
import SessionBar from '@/components/SessionBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SessionBar />
      {children}
    </AuthGuard>
  );
}
