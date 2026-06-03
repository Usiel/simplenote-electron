import React from 'react';

type IconProps = { className?: string };

const svgProps = (className?: string) => ({
  className,
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  width: 24,
  height: 24,
  fill: 'currentColor',
  'aria-hidden': true as const,
});

export const UndoIcon = ({ className }: IconProps) => (
  <svg {...svgProps(className)}>
    <path d="M12.5 8c-2.65 0-5.05 1.1-6.9 3.1L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
  </svg>
);

export const RedoIcon = ({ className }: IconProps) => (
  <svg {...svgProps(className)}>
    <path d="M18.4 10.6C16.55 8.6 14.15 7.5 11.5 7.5c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.06-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
  </svg>
);

export const BoldIcon = ({ className }: IconProps) => (
  <svg {...svgProps(className)}>
    <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.23 0 4.16-1.84 4.16-4 0-1.42-.86-2.65-2.6-3.21zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
  </svg>
);

export const ItalicIcon = ({ className }: IconProps) => (
  <svg {...svgProps(className)}>
    <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z" />
  </svg>
);

export const StrikeIcon = ({ className }: IconProps) => (
  <svg {...svgProps(className)}>
    <path d="M7.24 8.75c-.26-.48-.39-1.03-.39-1.67 0-1.3.54-2.3 1.61-3.01C9.53 3.45 10.88 3 12.5 3c1.79 0 3.25.5 4.37 1.5 1.12 1 1.69 2.35 1.69 4.05H16.4c0-.72-.2-1.27-.61-1.66-.41-.39-.97-.59-1.68-.59-.65 0-1.16.17-1.53.51-.37.34-.56.8-.56 1.38 0 .48.15.88.44 1.19.29.31.76.58 1.41.81l2.12.7c1.16.38 2.02.92 2.57 1.62.55.7.83 1.56.83 2.58 0 1.42-.55 2.54-1.64 3.35-1.09.81-2.52 1.22-4.29 1.22-1.93 0-3.47-.54-4.61-1.61-1.14-1.07-1.74-2.48-1.79-4.23h2.65c.05.95.37 1.68.96 2.19.59.51 1.37.77 2.34.77.78 0 1.4-.2 1.86-.59.46-.39.69-.92.69-1.59 0-.55-.18-1-.53-1.35-.35-.35-.9-.66-1.65-.93L7.24 8.75zM5 19h14v2H5v-2z" />
  </svg>
);

export const CodeIcon = ({ className }: IconProps) => (
  <svg {...svgProps(className)}>
    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
  </svg>
);

export const LinkIcon = ({ className }: IconProps) => (
  <svg {...svgProps(className)}>
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
  </svg>
);

export const HeadingIcon = ({
  className,
  level,
}: IconProps & { level: 2 | 3 | 4 }) => (
  <svg {...svgProps(className)}>
    <text
      x="12"
      y="17"
      fill="currentColor"
      fontSize="14"
      fontWeight="700"
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
    >
      H{level}
    </text>
  </svg>
);

export const BulletListIcon = ({ className }: IconProps) => (
  <svg {...svgProps(className)}>
    <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-4v2h14V9H7z" />
  </svg>
);

export const OrderedListIcon = ({ className }: IconProps) => (
  <svg {...svgProps(className)}>
    <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
  </svg>
);

export const BlockquoteIcon = ({ className }: IconProps) => (
  <svg {...svgProps(className)}>
    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
  </svg>
);

export const CodeBlockIcon = ({ className }: IconProps) => (
  <svg {...svgProps(className)}>
    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
    <path d="M3 20h18v2H3v-2z" opacity="0.5" />
  </svg>
);

export const HorizontalRuleIcon = ({ className }: IconProps) => (
  <svg {...svgProps(className)}>
    <path d="M4 11h16v2H4v-2z" />
  </svg>
);
