interface InfoCardProps {
  title: string;
  value: string;
  unit?: string;
}

export const InfoCard = ({ title, value, unit }: InfoCardProps) => {
  return (
    <div className="bg-card rounded-[16px] p-4 shadow-md border border-border/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <p className="text-xs uppercase text-muted-foreground font-medium tracking-wide mb-2">
        {title}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground font-medium">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};
