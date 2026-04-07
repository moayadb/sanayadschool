import { Header } from "@/components/layout/header";
import { CommunityNav } from "@/components/layout/community-nav";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <CommunityNav />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
