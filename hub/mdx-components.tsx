import type { MDXComponents } from "mdx/types";

/**
 * Case study prose. The `cs-*` classes live in `app/globals.css` alongside the
 * rest of the page, so the type scale is defined in one place rather than
 * split between CSS and component props.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children }) => <h2 className="cs-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="cs-h3">{children}</h3>,
    p: ({ children }) => <p className="cs-p">{children}</p>,
    ul: ({ children }) => <ul className="cs-ul">{children}</ul>,
    code: ({ children }) => <code className="cs-code">{children}</code>,
    pre: ({ children }) => <pre className="cs-pre">{children}</pre>,
    ...components,
  };
}
