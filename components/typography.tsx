import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface TypographyProps {
  className?: string;
  children: ReactNode;
}

export function H1({ className, children }: Readonly<TypographyProps>) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-8 mt-0",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function H2({ className, children }: Readonly<TypographyProps>) {
  return (
    <h2
      className={cn(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function H3({ className, children }: Readonly<TypographyProps>) {
  return (
    <h3
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-3",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function P({ className, children }: Readonly<TypographyProps>) {
  return (
    <p className={cn("leading-7 my-6 first:mt-0", className)}>{children}</p>
  );
}

export function BlockQuote({ className, children }: Readonly<TypographyProps>) {
  return (
    <blockquote
      className={cn(
        "border-l-2 pl-6 italic my-8 text-gray-800 border-gray-200",
        className
      )}
    >
      {children}
    </blockquote>
  );
}

export function UList({ className, children }: Readonly<TypographyProps>) {
  return (
    <ul
      className={cn(
        "my-6 ml-6 list-disc [&>li]:mt-2 [&>li]:pl-2 [&>li>ul]:mt-2 [&>li>ul]:mb-2 [&>li>ol]:mt-2 [&>li>ol]:mb-2",
        className
      )}
    >
      {children}
    </ul>
  );
}

export function OList({ className, children }: Readonly<TypographyProps>) {
  return (
    <ol
      className={cn(
        "my-6 ml-6 list-decimal [&>li]:mt-2 [&>li]:pl-2 [&>li>ul]:mt-2 [&>li>ul]:mb-2 [&>li>ol]:mt-2 [&>li>ol]:mb-2",
        className
      )}
    >
      {children}
    </ol>
  );
}

export function InlineLink({
  className,
  children,
  ...props
}: Readonly<TypographyProps & React.AnchorHTMLAttributes<HTMLAnchorElement>>) {
  return (
    <a
      className={cn(
        "font-medium underline underline-offset-4 text-blue-600",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}
