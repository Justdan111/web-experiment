import SplitHeadline from "./SplitHeadline";
import HeroVideo from "./HeroVideo";
import { HERO } from "../content/site";

export default function Hero() {
  return (
    <section className="relative">
      {/* Full-bleed loop. muted + playsInline are what make iOS autoplay at all. */}
      <HeroVideo />

      <div className="mx-auto max-w-(--content) px-(--gutter) py-16 md:py-24">
        <SplitHeadline
          text={HERO.statement}
          className="max-w-[24ch] text-[32px] leading-[1.16] md:text-[40px] lg:max-w-[30ch] lg:text-[48px] lg:leading-14"
          style={{ letterSpacing: "var(--track-48)" }}
        />
        <p
          className="mt-10 text-[32px] md:text-[40px] lg:text-[48px] lg:leading-14"
          style={{ color: "var(--muted)", letterSpacing: "var(--track-48)" }}
        >
          {HERO.link}
        </p>
      </div>
    </section>
  );
}
