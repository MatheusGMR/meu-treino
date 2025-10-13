interface SolidBackgroundWrapperProps {
  children: React.ReactNode;
}

export const SolidBackgroundWrapper = ({ children }: SolidBackgroundWrapperProps) => {
  return (
    <div className="relative min-h-screen">
      {/* Dark Solid Background */}
      <div className="fixed inset-0 bg-background -z-10" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
