import { useState, useEffect } from "react";
import { SidebarWithBackground } from "@/components/sidebar/SidebarWithBackground";
import { SidebarProvider } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  const toggleCollapsed = () => setCollapsed(prev => !prev);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <aside 
          className={`hidden md:block flex-shrink-0 relative z-20 h-screen sticky top-0 transition-all duration-300 ${
            collapsed ? "w-16" : "w-64"
          }`}
        >
          <SidebarWithBackground collapsed={collapsed} onToggle={toggleCollapsed} />
        </aside>
        <main className="flex-1 overflow-auto relative z-10 bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};
