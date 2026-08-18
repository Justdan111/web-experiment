import { NEWS } from "../content/news";
import { INDEX_SECTION } from "../content/site";
import NewsCard from "./NewsCard";
import Reveal from "./Reveal";

export default function NewsSection() {
  return (
    <section className="mx-auto max-w-(--content) px-(--gutter) py-24 md:py-32">
      <div className="flex items-center justify-between text-[16px]" style={{ letterSpacing: "var(--track-16)" }}>
        <h2
          className="m-0 text-[16px] font-medium"
          style={{ color: `var(${INDEX_SECTION.accent})`, letterSpacing: "var(--track-16)" }}
        >
          {INDEX_SECTION.label}
        </h2>
        <span style={{ color: "var(--muted)" }}>View All</span>
      </div>

      <Reveal stagger className="work-grid mt-6">
        {NEWS.map((item) => (
          <NewsCard key={item.slug} item={item} />
        ))}
      </Reveal>
    </section>
  );
}
