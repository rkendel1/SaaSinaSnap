import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const tabsVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
      },
      active: {
        true: "text-blue-600 border-b-2 border-blue-500 bg-blue-50", // ACTIVE: blue text, blue border, blue bg
        false: "text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:bg-blue-50", // INACTIVE: gray text, transparent border
      },
    },
    defaultVariants: {
      variant: "default",
      active: false,
    },
  }
);

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabsVariants> {
  active?: boolean;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, active, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(tabsVariants({ active: !!active }), className)}
      {...props}
    />
  )
);
TabsTrigger.displayName = "TabsTrigger";

export { TabsTrigger };