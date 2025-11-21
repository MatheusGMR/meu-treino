import { CardDescription, CardTitle } from "@/components/ui/card";

interface AnamnesisStepHeaderProps {
  title: string;
  description: string;
}

export const AnamnesisStepHeader = ({ title, description }: AnamnesisStepHeaderProps) => {
  return (
    <>
      <CardTitle className="text-2xl">{title}</CardTitle>
      <CardDescription className="text-base">{description}</CardDescription>
    </>
  );
};
