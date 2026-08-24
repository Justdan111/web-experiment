import { experiments } from "../content/experiments";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <header className="mb-16">
        <h1 className="text-4xl font-medium tracking-tight">Web Experiments</h1>
        <p className="mt-3 max-w-prose text-neutral-500">
          Sites built to learn something specific — layout systems, motion, interaction.
          Each one is live; click through to the thing itself.
        </p>
      </header>

      <ul className="grid gap-10 sm:grid-cols-2">
        {experiments.map((e) => (
          <li key={e.slug} className="group">
            {/* Plain anchor, never next/link: a different container serves this. */}
            <a href={e.href} className="block">
              <img
                src={e.poster}
                alt=""
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />
              <h2 className="mt-4 text-xl tracking-tight">
                {e.title}
                {e.status === "wip" && (
                  <span className="ml-2 align-middle text-xs uppercase tracking-widest text-neutral-400">
                    in progress
                  </span>
                )}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">{e.blurb}</p>
            </a>

            <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
              <span>{e.year}</span>
              <span>{e.tags.join(" · ")}</span>
              {e.notes && (
                <a href={`/notes/${e.slug}/`} className="underline hover:text-neutral-600">
                  read notes
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
