import { AppSidebar } from "./AppSidebar";

interface SidebarWithBackgroundProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const SidebarWithBackground = ({ collapsed = false, onToggle }: SidebarWithBackgroundProps) => {
  return (
    <div className="relative h-full w-full">
      {/* Background laranja com transparência */}
      <div 
        className="absolute inset-0 -z-10"
        style={{ 
          background: 'linear-gradient(135deg, hsl(25 95% 53% / 0.03), hsl(25 95% 53% / 0.01))'
        }}
      />

      {/* Sidebar Content */}
      <div className="relative z-10 h-full">
        <AppSidebar collapsed={collapsed} onToggle={onToggle} />
      </div>
    </div>
  );
};
