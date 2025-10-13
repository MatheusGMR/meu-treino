interface BackgroundWrapperProps {
  children: React.ReactNode;
}

export const BackgroundWrapper = ({ children }: BackgroundWrapperProps) => {
  return (
    <div className="relative min-h-screen">
      {/* Dark Background */}
      <div className="fixed inset-0 bg-background -z-10" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
