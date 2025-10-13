import { SidebarWithBackground } from "@/components/sidebar/SidebarWithBackground";
import { SidebarProvider } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <aside className="hidden md:block w-64 flex-shrink-0 relative z-20 h-screen sticky top-0">
          <SidebarWithBackground />
        </aside>
        <main className="flex-1 overflow-auto relative z-10 bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};
