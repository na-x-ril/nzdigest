
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 90 56" // Adjusted viewBox for "NZD"
      {...props}
    >
      <text
        x="0" // Position for "N"
        y="43" // Adjusted y for Inter font vertical centering
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        N
      </text>
      <text
        x="30" // Position for "Z"
        y="43" // Adjusted y
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        Z
      </text>
      <text
        x="60" // Position for "D"
        y="43" // Adjusted y
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
