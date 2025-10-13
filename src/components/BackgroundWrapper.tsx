import { useBackgroundImage } from "@/hooks/useBackgroundImage";

interface BackgroundWrapperProps {
  children: React.ReactNode;
  overlayOpacity?: "light" | "medium" | "dark";
}

export const BackgroundWrapper = ({ 
  children, 
  overlayOpacity = "medium" 
}: BackgroundWrapperProps) => {
  const backgroundImage = useBackgroundImage();

  const overlayClasses = {
    light: "bg-gradient-to-r from-background/80 via-background/70 to-background/50",
    medium: "bg-gradient-to-r from-background/90 via-background/85 to-background/70",
    dark: "bg-gradient-to-r from-background/99 via-background/98 to-background/95 backdrop-blur-sm",
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10 transition-all duration-1000 ease-in-out"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className={`absolute inset-0 ${overlayClasses[overlayOpacity]}`} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
