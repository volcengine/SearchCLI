import { Children } from "react";
import Markdown, { type Components } from "react-markdown";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const allowedMarkdownElements = [
  "a",
  "blockquote",
  "br",
  "code",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "ul"
] as const;

const markdownComponents: Components = {
  a({ node: _node, className, ...props }) {
    return (
      <a
        {...props}
        className={cn(
          "font-medium text-primary underline underline-offset-4 hover:text-primary/80",
          className
        )}
        target="_blank"
        rel="noreferrer"
      />
    );
  },
  blockquote({ node: _node, className, ...props }) {
    return (
      <blockquote
        {...props}
        className={cn("border-l-2 border-border pl-3 text-muted-foreground", className)}
      />
    );
  },
  code({ node: _node, className, ...props }) {
    return (
      <code
        {...props}
        className={cn(
          "rounded-md bg-muted px-1 py-0.5 font-mono text-sm text-foreground",
          className
        )}
      />
    );
  },
  h1({ node: _node, className, ...props }) {
    return <h1 {...props} className={cn("text-base font-semibold leading-6", className)} />;
  },
  h2({ node: _node, className, ...props }) {
    return <h2 {...props} className={cn("text-base font-semibold leading-6", className)} />;
  },
  h3({ node: _node, className, ...props }) {
    return <h3 {...props} className={cn("text-sm font-semibold leading-6", className)} />;
  },
  h4({ node: _node, className, ...props }) {
    return <h4 {...props} className={cn("text-sm font-semibold leading-6", className)} />;
  },
  h5({ node: _node, className, ...props }) {
    return <h5 {...props} className={cn("text-sm font-semibold leading-6", className)} />;
  },
  h6({ node: _node, className, ...props }) {
    return <h6 {...props} className={cn("text-sm font-semibold leading-6", className)} />;
  },
  hr({ node: _node }) {
    return <Separator className="my-1" />;
  },
  li({ node: _node, className, ...props }) {
    return <li {...props} className={cn("pl-1", className)} />;
  },
  ol({ node: _node, className, ...props }) {
    return <ol {...props} className={cn("list-decimal pl-5", className)} />;
  },
  p({ node: _node, children, className, ...props }) {
    if (Children.count(children) === 0) return null;

    return (
      <p {...props} className={cn("leading-7", className)}>
        {children}
      </p>
    );
  },
  pre({ node: _node, className, ...props }) {
    return (
      <pre
        {...props}
        className={cn(
          "overflow-x-auto rounded-lg border bg-muted p-3 text-sm leading-6 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit [&_code]:whitespace-pre",
          className
        )}
      />
    );
  },
  ul({ node: _node, className, ...props }) {
    return <ul {...props} className={cn("list-disc pl-5", className)} />;
  }
};

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-2 break-words text-sm leading-7">
      <Markdown
        allowedElements={allowedMarkdownElements}
        components={markdownComponents}
        skipHtml
      >
        {content}
      </Markdown>
    </div>
  );
}
