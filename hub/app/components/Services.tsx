import { Reveal, RevealItem, RevealStagger } from "./Reveal";
import { SectionLabel } from "./SectionLabel";

const services = [
  {
    title: "Mobile interaction",
    body: "React Native and Expo apps, and the gestures, transitions and haptics that make them feel handled rather than operated.",
  },
  {
    title: "Web interfaces",
    body: "Next.js sites with editorial layout, scroll choreography, and motion that still reads on a slow connection.",
  },
  {
    title: "Design to build",
    body: "Taking a comp to the interaction it implies but cannot show — the way a bar reacts to a scroll, the way a card knows it has been picked up.",
  },
];

export function Services() {
  return (
    <section
      id="services"
      className="mx-auto max-w-6xl px-4 sm:px-6 pb-24 sm:pb-32"
    >
      <Reveal>
        <SectionLabel>What I do</SectionLabel>
        <h2 className="mt-4 max-w-2xl text-4xl sm:text-5xl font-semibold tracking-tight">
          the work behind the experiments
        </h2>
      </Reveal>

      <RevealStagger className="mt-12 grid gap-6 md:grid-cols-3">
        {services.map((service, i) => (
          <RevealItem key={service.title}>
            <article className="h-full rounded-3xl border border-border p-8 transition-colors hover:bg-card">
              <span className="font-mono text-xs tabular-nums text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                {service.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {service.body}
              </p>
            </article>
          </RevealItem>
        ))}
      </RevealStagger>
    </section>
  );
}
