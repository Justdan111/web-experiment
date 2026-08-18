import Image from "next/image";
import type { NewsItem } from "../content/types";

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="group">
      <div className="aspect-7/5 overflow-hidden" style={{ background: "var(--hairline)" }}>
        <Image
          src={item.image}
          alt={item.headline}
          width={700}
          height={520}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 338px"
        />
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4 text-[12px]" style={{ letterSpacing: "var(--track-12)" }}>
        <span style={{ color: `var(${item.accent})` }}>{item.category}</span>
        <span className="font-mono" style={{ color: "var(--muted)" }}>
          {item.date}
        </span>
      </div>

      <h3 className="mt-3 text-[16px] leading-[1.45]" style={{ letterSpacing: "var(--track-16)" }}>
        {item.headline}
      </h3>
    </article>
  );
}
