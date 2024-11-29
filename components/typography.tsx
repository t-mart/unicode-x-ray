import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface TypographyProps {
  className?: string;
  children: ReactNode;
}

type HeadingProps<T extends keyof JSX.IntrinsicElements> = TypographyProps &
  JSX.IntrinsicElements[T];

export function H1({
  className,
  children,
  ...rest
}: Readonly<HeadingProps<"h1">>) {
  return (
    <h1
      {...rest}
      className={cn(
        "text-4xl font-extrabold tracking-tight lg:text-5xl mb-8 mt-0",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function H2({
  className,
  children,
  ...rest
}: Readonly<HeadingProps<"h2">>) {
  return (
    <h2
      {...rest}
      className={cn(
        "border-b pb-2 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function H3({
  className,
  children,
  ...rest
}: Readonly<HeadingProps<"h3">>) {
  return (
    <h3
      {...rest}
      className={cn(
        "text-2xl font-semibold tracking-tight mt-8 mb-3",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function H4({
  className,
  children,
  ...rest
}: Readonly<HeadingProps<"h4">>) {
  return (
    <h4
      {...rest}
      className={cn(
        "text-xl font-semibold tracking-tight mt-6 mb-2",
        className
      )}
    >
      {children}
    </h4>
  );
}

export function P({ className, children, ...rest }: Readonly<TypographyProps>) {
  return (
    <p className={cn("leading-7 my-6 first:mt-0", className)} {...rest}>
      {children}
    </p>
  );
}

export function BlockQuote({
  className,
  children,
  ...rest
}: Readonly<TypographyProps>) {
  return (
    <blockquote
      className={cn(
        "border-l-2 pl-6 italic my-8 text-gray-800 border-gray-200",
        className
      )}
      {...rest}
    >
      {children}
    </blockquote>
  );
}

export function UList({
  className,
  children,
  ...rest
}: Readonly<TypographyProps>) {
  return (
    <ul
      className={cn(
        "my-6 ml-6 list-disc [&>li]:mt-2 [&>li]:pl-2 [&>li>ul]:mt-2 [&>li>ul]:mb-2 [&>li>ol]:mt-2 [&>li>ol]:mb-2",
        className
      )}
      {...rest}
    >
      {children}
    </ul>
  );
}

export function OList({
  className,
  children,
  ...rest
}: Readonly<TypographyProps>) {
  return (
    <ol
      className={cn(
        "my-6 ml-6 list-decimal [&>li]:mt-2 [&>li]:pl-2 [&>li>ul]:mt-2 [&>li>ul]:mb-2 [&>li>ol]:mt-2 [&>li>ol]:mb-2",
        className
      )}
      {...rest}
    >
      {children}
    </ol>
  );
}
