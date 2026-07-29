import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { useMagnetic } from "../../hooks/useMagnetic";
import { cn } from "../../lib/utils";
import { buttonVariants, type ButtonProps } from "./button";

type MagneticLinkProps = HTMLMotionProps<"a"> &
  Pick<ButtonProps, "variant" | "size"> & {
    children: ReactNode;
    external?: boolean;
  };

export function MagneticLink({
  children,
  className,
  variant,
  size,
  external,
  ...props
}: MagneticLinkProps) {
  const magnetic = useMagnetic(0.22);

  return (
    <motion.a
      className={cn(buttonVariants({ variant, size }), className)}
      style={magnetic.style}
      onPointerMove={magnetic.onPointerMove}
      onPointerLeave={magnetic.onPointerLeave}
      target={external ? "_blank" : props.target}
      rel={external ? "noreferrer" : props.rel}
      whileTap={{ scale: 0.97 }}
      {...props}
    >
      {children}
    </motion.a>
  );
}
