import type { ComponentType, SVGProps } from "react";

/**
 * IconComponent — shape compatible with both lucide-react icons and custom React SVG components.
 *
 * Centralizing this here avoids TS2322 noise from `exactOptionalPropertyTypes` when mapping
 * icons through Record<...> structures.
 */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
