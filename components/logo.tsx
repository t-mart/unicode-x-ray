import { cn } from "@/lib/utils";

export default function Logo({
  outerClassName,
  pathClassName,
}: Readonly<{ outerClassName?: string; pathClassName?: string }>) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(outerClassName)}
    >
        <rect x="0" y="0" width="100" height="100" className="fill-background" />
      <path
        style={{
          strokeWidth: 3,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeDasharray: "16,6",
        }}
        className={cn("fill-none stroke-foreground", pathClassName)}
        d="M54 98H42l-9-29-9 29H13l14-44-14-43h12l9 27 9-27h11L40 53Zm29-60v-6l-3-3-2-2h-7v24h3l4-1 3-2 2-4v-6zm17 60H87L76 66h-5v32H60V11h18l6 1 5 4 4 7 1 12-2 16c-1 4-3 7-6 10z"
        aria-label="UXR"
        transform="translate(-6 -5)"
      />
    </svg>
  );
}
