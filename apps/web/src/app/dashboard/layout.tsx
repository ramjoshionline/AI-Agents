import DashboardNav from "@/components/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg font-mono text-text-main">
      <DashboardNav />
      <main className="pt-14">{children}</main>
    </div>
  );
}
