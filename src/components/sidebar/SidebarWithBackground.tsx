import { useBackgroundImage } from "@/hooks/useBackgroundImage";
import { AppSidebar } from "./AppSidebar";

export const SidebarWithBackground = () => {
  const backgroundImage = useBackgroundImage();

  return (
    <div className="relative h-full w-full">
      {/* Background Image - apenas na sidebar */}
      <div 
        className="absolute inset-0 bg-cover bg-center -z-10 transition-all duration-1000 ease-in-out"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {/* Overlay escuro para contraste */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/85 backdrop-blur-sm" />
      </div>

      {/* Sidebar Content */}
      <div className="relative z-10 h-full">
        <AppSidebar />
      </div>
    </div>
  );
};
