import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

const RadioCardGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-3", className)}
      {...props}
      ref={ref}
    />
  );
});
RadioCardGroup.displayName = "RadioCardGroup";

const RadioCardItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "flex w-full items-center justify-start rounded-lg border-2 border-muted bg-background p-4 text-base font-medium transition-all duration-200 hover:bg-orange-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500/[0.02] data-[state=checked]:ring-2 data-[state=checked]:ring-orange-500/20 cursor-pointer",
        className
      )}
      {...props}
    >
      <span className="flex-1 text-left">{children}</span>
    </RadioGroupPrimitive.Item>
  );
});
RadioCardItem.displayName = "RadioCardItem";

export { RadioCardGroup, RadioCardItem };
