import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="text-3xl tracking-tight">{children}</h1>,
    p: ({ children }) => <p className="mt-4 max-w-prose text-neutral-600">{children}</p>,
    ...components,
  };
}
