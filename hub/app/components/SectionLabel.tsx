import clsx from "clsx";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "font-mono text-xs uppercase tracking-[0.18em] text-accent",
        className,
      )}
    >
      <span aria-hidden className="mr-1.5">
        //
      </span>
      {children}
    </span>
  );
}
