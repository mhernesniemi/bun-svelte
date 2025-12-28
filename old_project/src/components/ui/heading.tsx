import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const headingVariants = cva("tracking-tight text-foreground", {
  variants: {
    level: {
      1: "text-3xl sm:text-4xl font-semibold",
      2: "text-xl sm:text-2xl font-semibold",
      3: "text-lg font-semibold",
    },
    tone: {
      default: "",
      muted: "text-muted-foreground",
    },
  },
  defaultVariants: {
    level: 2,
    tone: "default",
  },
});

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    level?: 1 | 2 | 3;
  };

export function Heading({
  className,
  level = 2,
  tone,
  ...props
}: HeadingProps) {
  const Comp = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
  return (
    <Comp
      className={cn(headingVariants({ level, tone }), className)}
      {...props}
    />
  );
}
