import * as React from "react"

import { cn } from "@/lib/utils"

function TypographyH1({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="typography-h1"
      className={cn(
        "scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance",
        className
      )}
      {...props}
    />
  )
}

function TypographyH2({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="typography-h2"
      className={cn(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className
      )}
      {...props}
    />
  )
}

function TypographyH3({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="typography-h3"
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function TypographyH4({ className, ...props }: React.ComponentProps<"h4">) {
  return (
    <h4
      data-slot="typography-h4"
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function TypographyH5({ className, ...props }: React.ComponentProps<"h5">) {
  return (
    <h5
      data-slot="typography-h5"
      className={cn(
        "scroll-m-20 text-lg font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function TypographyH6({ className, ...props }: React.ComponentProps<"h6">) {
  return (
    <h6
      data-slot="typography-h6"
      className={cn(
        "scroll-m-20 text-base font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function TypographyP({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="typography-p"
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    />
  )
}

function TypographyBlockquote({
  className,
  ...props
}: React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      data-slot="typography-blockquote"
      className={cn("mt-6 border-l-2 pl-6 italic", className)}
      {...props}
    />
  )
}

function TypographyList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="typography-list"
      className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}
      {...props}
    />
  )
}

function TypographyOrderedList({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="typography-ordered-list"
      className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)}
      {...props}
    />
  )
}

function TypographyListItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="typography-list-item" className={className} {...props} />
}

function TypographyInlineCode({
  className,
  ...props
}: React.ComponentProps<"code">) {
  return (
    <code
      data-slot="typography-inline-code"
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className
      )}
      {...props}
    />
  )
}

function TypographyPre({ className, ...props }: React.ComponentProps<"pre">) {
  return (
    <pre
      data-slot="typography-pre"
      className={cn(
        "my-6 overflow-x-auto rounded-lg border bg-muted p-4",
        className
      )}
      {...props}
    />
  )
}

function TypographyLead({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="typography-lead"
      className={cn("text-xl text-muted-foreground", className)}
      {...props}
    />
  )
}

function TypographyLarge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="typography-large"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

function TypographySmall({ className, ...props }: React.ComponentProps<"small">) {
  return (
    <small
      data-slot="typography-small"
      className={cn("text-sm leading-none font-medium", className)}
      {...props}
    />
  )
}

function TypographyMuted({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="typography-muted"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyH5,
  TypographyH6,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyListItem,
  TypographyMuted,
  TypographyOrderedList,
  TypographyP,
  TypographyPre,
  TypographySmall,
}
