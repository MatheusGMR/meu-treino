import { AppSidebar } from "./AppSidebar";

export const SidebarWithBackground = () => {
  return (
    <div className="relative h-full w-full">
      {/* Background laranja com transparência */}
      <div 
        className="absolute inset-0 -z-10"
        style={{ 
          background: 'linear-gradient(135deg, hsl(25 95% 53% / 0.15), hsl(25 95% 53% / 0.08))'
        }}
      />

      {/* Sidebar Content */}
      <div className="relative z-10 h-full">
        <AppSidebar />
      </div>
    </div>
  );
};
