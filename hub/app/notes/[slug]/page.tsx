import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { experiments } from "../../../content/experiments";
import { Footer } from "../../components/Footer";
import { MediaPlate } from "../../components/MediaPlate";
import { MoreFromPlayground } from "../../components/MoreFromPlayground";
import { Nav } from "../../components/Nav";
import { RunBlock } from "../../components/RunBlock";
import { SectionLabel } from "../../components/SectionLabel";
import { ArrowUpRight } from "../../components/icons";

export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/notes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const experiment = experiments.find((e) => e.slug === slug);
  if (!experiment) return {};

  return {
    title: `${experiment.title} — dan / experiments`,
    description: experiment.blurb,
  };
}

export default async function NotePage({ params }: PageProps<"/notes/[slug]">) {
  const { slug } = await params;

  const index = experiments.findIndex((e) => e.slug === slug);
  const experiment = experiments[index];
  if (!experiment) notFound();

  const { title, blurb, platform, category, tags, year, notes, live, repo } =
    experiment;

  // A web experiment has somewhere to open; a mobile one has only its source.
  const action = live
    ? { href: live, label: "View live" }
    : { href: repo, label: "View on GitHub" };
  // Only a path on this host stays in the tab. An experiment hosted on its own
  // is another site, and so is GitHub.
  const outbound = !live?.startsWith("/");


  return (
    <>
      <Nav />

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 pt-16 sm:pt-24">
          <SectionLabel>
            {platform} · {category} · {year}
          </SectionLabel>

          <h1 className="mt-5 text-5xl sm:text-6xl font-semibold leading-[1.02] tracking-tight">
            {title}
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {blurb}
          </p>

          {/* Plain anchor even for the live path: /verso/ and /fort/ are built
              by a different Next app, so a client-side navigation would 404. */}
          <a
            href={action.href}
            {...(outbound ? { target: "_blank", rel: "noreferrer" } : {})}
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {action.label}
            <ArrowUpRight
              width={14}
              height={14}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>

          <figure className="relative mt-12 aspect-16/10 overflow-hidden rounded-3xl border border-border">
            <MediaPlate experiment={experiment} />
          </figure>

          <ul aria-label="Built with" className="mt-6 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>

          <div className="mt-14 space-y-10">
            {notes.map((note) => (
              <section key={note.heading}>
                <h2 className="text-xl font-semibold tracking-tight">
                  {note.heading}
                </h2>
                <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">
                  {note.body}
                </p>
              </section>
            ))}
          </div>
        </article>

        <RunBlock experiment={experiment} />

        <MoreFromPlayground experiment={experiment} />

      </main>

      <Footer />
    </>
  );
}
