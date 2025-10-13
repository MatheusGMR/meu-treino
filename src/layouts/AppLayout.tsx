import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BackgroundWrapper } from "@/components/BackgroundWrapper";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <BackgroundWrapper overlayOpacity="light">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <aside className="hidden md:block w-64 flex-shrink-0 relative z-20">
            <AppSidebar />
          </aside>
          <main className="flex-1 overflow-auto relative z-10">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </BackgroundWrapper>
  );
};
