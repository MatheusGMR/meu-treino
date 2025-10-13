interface SolidBackgroundWrapperProps {
  children: React.ReactNode;
}

export const SolidBackgroundWrapper = ({ children }: SolidBackgroundWrapperProps) => {
  return (
    <div className="relative min-h-screen">
      {/* Dark Solid Background with subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-background/95 -z-10" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
