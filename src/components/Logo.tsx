
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 70 56" // Adjusted for tightly kerned "NZD"
      {...props}
    >
      <text
        x="0" // N
        y="43"
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        N
      </text>
      <text
        x="23" // Z, adjusted for a connected look with N
        y="43"
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        Z
      </text>
      <text
        x="46" // D, adjusted for a connected look with Z
        y="43"
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        D
      </text>
    </svg>
  );
}
