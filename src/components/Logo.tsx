
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 205 56" // Adjusted viewBox for "NZDigest"
      {...props}
    >
      <text
        x="0"
        y="43"
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        N
      </text>
      <text
        x="25" // Adjusted x for "Z" for a connected look
        y="43"
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        Z
      </text>
      <text
        x="50" // Adjusted x for "D" for a connected look
        y="43"
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        D
      </text>
      <text
        x="75" // Adjusted x for "i"
        y="43"
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        i
      </text>
      <text
        x="88" // Adjusted x for "g"
        y="43"
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        g
      </text>
      <text
        x="113" // Adjusted x for "e"
        y="43"
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        e
      </text>
      <text
        x="136" // Adjusted x for "s"
        y="43"
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        s
      </text>
      <text
        x="159" // Adjusted x for "t"
        y="43"
        fontFamily="Inter, sans-serif, Arial"
        fontSize="50"
        fontWeight="bold"
        fill="currentColor"
      >
        t
      </text>
    </svg>
  );
}
