import heroImage from "@/assets/hero-fitness.jpg";

interface BackgroundWrapperProps {
  children: React.ReactNode;
  overlayOpacity?: "light" | "medium" | "heavy" | "dark";
}

export const BackgroundWrapper = ({ children, overlayOpacity = "medium" }: BackgroundWrapperProps) => {
  const overlayClasses = {
    light: "bg-gradient-to-r from-background/80 via-background/90 to-background/70",
    medium: "bg-gradient-to-r from-background via-background/95 to-background/60",
    heavy: "bg-gradient-to-r from-background via-background/98 to-background/85",
    dark: "bg-gradient-to-r from-background/99 via-background/98 to-background/96 backdrop-blur-sm",
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${heroImage})` }}
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
