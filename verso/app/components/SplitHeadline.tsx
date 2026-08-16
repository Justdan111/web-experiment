"use client";

import { useRef, type CSSProperties } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText, prefersReducedMotion, registerGsap } from "../lib/gsap";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
};

export default function SplitHeadline({ text, className, style }: Props) {
  const el = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!el.current || prefersReducedMotion()) return;

      let split: SplitText | undefined;

      // Splitting before the webfont lands measures fallback glyph widths,
      // and the whole headline reflows when the real face arrives.
      const run = () => {
        if (!el.current) return;
        split = SplitText.create(el.current, {
          type: "words,chars",
          wordsClass: "vs-word",
          charsClass: "vs-char",
        });

        gsap.from(split.chars, {
          autoAlpha: 0,
          yPercent: 40,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.012,
          scrollTrigger: { trigger: el.current, start: "top 90%", once: true },
        });
      };

      document.fonts.ready.then(run);

      return () => split?.revert();
    },
    { scope: el },
  );

  return (
    <h1 ref={el} className={className} style={style}>
      {text}
    </h1>
  );
}
