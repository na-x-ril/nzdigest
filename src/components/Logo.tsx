import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 58 56" // Adjusted viewBox for a snug fit around the letters
      // Default width/height can be set here, but className (e.g., h-6 w-6) usually overrides
      // width="24"
      // height="24"
      {...props} // Spread props first so className can override default width/height if they were set
    >
      <text
        x="-2" // T remains in its original x position
        y="46" // Adjusted y for better vertical centering with Inter font
        fontFamily="Inter, sans-serif, Arial" // Added Arial as a common fallback
        fontSize="50" // Slightly adjusted font size for balance
        fontWeight="bold"
        fill="currentColor" // Inherits color from parent (e.g., text-primary)
      >
        T
      </text>
      <text
        x="23.5" // Moved D closer to T (was 26) for top bar merge effect
        y="46" // Adjusted y for better vertical centering
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor" // Inherits color from parent
      >
        D
      </text>
    </svg>
  );
}
