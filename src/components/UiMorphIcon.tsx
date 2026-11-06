import type { ComponentProps } from "react";
import { MorphIcon } from "morphicons/react";

type Props = Omit<ComponentProps<typeof MorphIcon>, "spring" | "reducedMotion">;

/** Shared motion and stroke settings for every interactive FuelUp icon. */
export function UiMorphIcon({ size = 20, className = "", ...props }: Props) {
  return (
    <MorphIcon
      {...props}
      size={size}
      className={`morph-icon ${className}`}
      spring="snappy"
      reducedMotion="user"
    />
  );
}
