"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ParticleBall from "./ParticleBall";
import RacketCursor from "./RacketCursor";
import { COACHES, GALLERY, NAV, STATS, TESTIMONIALS } from "../content";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);

  const ballScene = useRef<HTMLElement>(null);
  const ballInner = useRef<HTMLDivElement>(null);
  const bigBall = useRef<HTMLImageElement>(null);
  const oneLine = useRef<HTMLHeadingElement>(null);

  const zoomer = useRef<HTMLDivElement>(null);
  const zoomInner = useRef<HTMLDivElement>(null);

  const coachScroll = useRef<HTMLDivElement>(null);
  const coachInner = useRef<HTMLDivElement>(null);
  const coachTabsRef = useRef<HTMLDivElement>(null);
  const coachRail = useRef<HTMLSpanElement>(null);
  const coachTrigger = useRef<ScrollTrigger | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCoach, setActiveCoach] = useState(0);

  /* ------------------------------------------------------------------
     GSAP — every scroll-driven scene on the page
     ------------------------------------------------------------------ */
  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      /* ---------- 1. the wordmark shrinks into the navbar ---------- */
      const brand = brandRef.current;
      if (brand) {
        const metrics = () => {
          const w = brand.offsetWidth;
          const h = brand.offsetHeight || 1;
          const vw = window.innerWidth;
          const mobile = vw <= 900;
          // the wordmark sits in the space the .nav-spaces block reserves for it
          const reserved =
            (document.querySelector(".nav-spaces") as HTMLElement | null)
              ?.offsetHeight ?? 401;
          return {
            bx: (vw - w) / 2,
            by: reserved * 0.264,
            sx: mobile ? 20 : 40,
            sy: mobile ? 16 : 27,
            ss: (mobile ? 20 : 26) / h,
          };
        };

        gsap.fromTo(
          brand,
          { x: () => metrics().bx, y: () => metrics().by, scale: 1 },
          {
            x: () => metrics().sx,
            y: () => metrics().sy,
            scale: () => metrics().ss,
            ease: "power3.inOut",
            immediateRender: true,
            scrollTrigger: {
              start: 0,
              end: () => (window.innerWidth <= 900 ? 220 : 380),
              scrub: 0.5,
              invalidateOnRefresh: true,
              onUpdate: (self) =>
                navRef.current?.classList.toggle("shrunk", self.progress > 0.35),
            },
          },
        );
      }

      /* ---------- 2. the tennis ball rolls across "one community" ---------- */
      if (ballScene.current && bigBall.current && oneLine.current) {
        gsap.set(bigBall.current, { xPercent: -50, yPercent: -50 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ballScene.current,
            start: "top top",
            end: "+=180%",
            scrub: 0.6,
            pin: ballInner.current,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        tl.fromTo(
          bigBall.current,
          {
            x: () => window.innerWidth * 0.58,
            y: () => window.innerHeight * 0.52,
            rotation: 0,
          },
          {
            x: () => -window.innerWidth * 0.78,
            y: () => -window.innerHeight * 0.12,
            rotation: 320,
            ease: "none",
          },
          0,
        )
          // scale rides its own ease — the ball swells to near full size by the
          // midpoint and then only creeps. Scaling it linearly with the travel
          // flattens the whole scene into an even zoom.
          .fromTo(
            bigBall.current,
            { scale: 0.26 },
            { scale: 1.18, ease: "power3.out" },
            0,
          )
          .fromTo(
            oneLine.current,
            { y: () => window.innerHeight * 0.42 },
            { y: () => -window.innerHeight * 0.34, ease: "none" },
            0,
          );
      }

      /* ---------- 3. the community gallery zooms image over image ---------- */
      if (zoomer.current && zoomInner.current) {
        const imgs = gsap.utils.toArray<HTMLElement>(".zoom-img", zoomer.current);
        const n = imgs.length;

        const paint = (p: number) => {
          imgs.forEach((el, i) => {
            const t = p * (n - 1) - (i - 1);
            if (t <= 0) {
              gsap.set(el, { autoAlpha: 0 });
              return;
            }
            const grow = clamp(t, 0, 1);
            const scale = 0.155 + 0.845 * easeOutCubic(grow) + clamp(t - 1, 0, 1.4) * 0.22;
            gsap.set(el, { autoAlpha: 1, scale, zIndex: i + 1 });
          });
        };

        ScrollTrigger.create({
          trigger: zoomer.current,
          start: "top top",
          end: "+=650%",
          scrub: true,
          pin: zoomInner.current,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => paint(self.progress),
          onRefresh: (self) => paint(self.progress),
        });
        paint(0);
      }

      /* ---------- 4. the coach carousel ---------- */
      if (coachScroll.current && coachInner.current) {
        const slides = gsap.utils.toArray<HTMLElement>(
          ".coach-slide",
          coachScroll.current,
        );
        const n = slides.length;
        let current = -1;

        const paint = (p: number) => {
          const slot = p * n;
          slides.forEach((el, i) => {
            const d = slot - i;
            // crossfade window from the reference — wide enough that a coach
            // is still easing out while the next eases in
            const opacity = clamp(
              Math.min((d + 0.18) / 0.32, (1.18 - d) / 0.32),
              0,
              1,
            );
            gsap.set(el, {
              autoAlpha: opacity,
              y: (0.5 - clamp(d, 0, 1)) * 46,
            });
          });
          const next = clamp(Math.floor(slot), 0, n - 1);
          if (next !== current) {
            current = next;
            setActiveCoach(next);
          }
        };

        coachTrigger.current = ScrollTrigger.create({
          trigger: coachScroll.current,
          start: "top top",
          end: "+=520%",
          scrub: true,
          pin: coachInner.current,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => paint(self.progress),
          onRefresh: (self) => paint(self.progress),
        });
        paint(0);
      }

      /* ---------- 5. blur-up reveals ---------- */
      const reveals = gsap.utils.toArray<HTMLElement>(".reveal");
      gsap.set(reveals, { autoAlpha: 0, y: 18, filter: "blur(10px)" });
      ScrollTrigger.batch(reveals, {
        start: "top 92%",
        onEnter: (els) =>
          gsap.to(els, {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.08,
            overwrite: true,
          }),
      });

      /* ---------- 6. stat counters ---------- */
      gsap.utils.toArray<HTMLElement>(".stat-num").forEach((el, i) => {
        const stat = STATS[i];
        if (!stat) return;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: stat.value,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v));
          },
          onComplete: () => {
            el.textContent = stat.value + stat.suffix;
          },
        });
      });
    }, root);

    // The wordmark shrink is measured from the display font's own box. That
    // font loads with `display: block`, so the first measurement can land on
    // fallback metrics and leave the brand shrinking to the wrong size and
    // offset. The reference re-ran its whole layout on document.fonts.ready;
    // this is the ScrollTrigger equivalent.
    let stale = false;
    document.fonts?.ready.then(() => {
      if (!stale) ScrollTrigger.refresh();
    });

    return () => {
      stale = true;
      ctx.revert();
    };
  }, []);

  /* ---------- keep the lime rail under the active coach tab ---------- */
  useIsomorphicLayoutEffect(() => {
    const tabs = coachTabsRef.current;
    const rail = coachRail.current;
    if (!tabs || !rail) return;
    const move = () => {
      const btn = tabs.querySelectorAll("button")[activeCoach] as
        | HTMLButtonElement
        | undefined;
      if (!btn) return;
      rail.style.left = `${btn.offsetLeft}px`;
      rail.style.width = `${btn.offsetWidth}px`;
    };
    move();
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
  }, [activeCoach]);

  const jumpToCoach = (i: number) => {
    const st = coachTrigger.current;
    if (!st) return;
    window.scrollTo({
      top: st.start + (st.end - st.start) * ((i + 0.5) / COACHES.length),
      behavior: "smooth",
    });
  };

  /* ------------------------------------------------------------------ */

  return (
    <div ref={root}>
      <div className="nav-blur" aria-hidden="true" />

      <header className="nav" ref={navRef}>
        <nav className="nav-links">
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <button
          className={`burger${menuOpen ? " open" : ""}`}
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </header>

      {/* the giant wordmark IS the logo — it shrinks into the navbar */}
      <a className="brand" ref={brandRef} href="#top" aria-label="FORT">
        <span className="brand-letter">F</span>
        <span className="brand-ball">
          <ParticleBall count={4200} />
        </span>
        <span className="brand-letter">RT</span>
      </a>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        {NAV.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
            {item.label}
          </a>
        ))}
      </div>

      <main id="top">
        <div className="nav-spaces" />

        {/* ═══════════ HERO ═══════════ */}
        <section className="hero" id="hero">
          <h1 className="hero-title">
            Serve<em>.</em> Rally<em>.</em> Socialize<em>.</em>
          </h1>
          <p className="hero-sub">
            Join FORT, Abuja&rsquo;s premier tennis club. Floodlit hard courts for
            players who play to win.
          </p>
          <div className="hero-actions">
            <a className="btn btn-lime" href="#pricing">
              RESERVE A COURT
              <i className="btn-ico" aria-hidden="true" />
            </a>
            <a className="btn btn-ghost" href="#pricing">
              Join the Club
              <i className="btn-ico light" aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* ═══════════ BALL / ONE COMMUNITY ═══════════ */}
        <section className="ballscene" ref={ballScene}>
          <div className="ballscene-inner" ref={ballInner}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="bigball" ref={bigBall} src="/media/ball.png" alt="" />
            <h2 className="oneline" ref={oneLine}>
              All ages. All levels. One community.
            </h2>
          </div>
        </section>

        {/* ═══════════ THE CLUB ═══════════ */}
        <section className="club" id="club">
          <div className="container club-grid">
            <div className="club-copy">
              <h2 className="h-section reveal">
                NOT JUST A CLUB <span className="lime">A MOVEMENT</span>
              </h2>
              <p className="club-body reveal">
                FORT is where Abuja comes to play. We bridge the gap between elite
                performance and family fun. Whether you&rsquo;re introducing your
                kids to their first racket, leveling up with our pro coaches, or
                competing in the veterans league there&rsquo;s a court waiting for
                you.
              </p>
              <a className="btn btn-ghost reveal" href="#pricing">
                Join the Club
                <i className="btn-ico light" aria-hidden="true" />
              </a>
            </div>
            <div className="club-media reveal">
              <div className="arch">
                <video src="/media/club.mp4" autoPlay muted loop playsInline />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ STATS ═══════════ */}
        <section className="stats">
          <div className="container stats-grid">
            {STATS.map((s) => (
              <div className="stat" key={s.label}>
                <span className={`stat-num${s.big ? " big" : ""}`}>0</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ COMMUNITY ═══════════ */}
        <section className="gallery" id="community">
          <div className="container gallery-head">
            <h2 className="h-title reveal">
              COMMUNITY<em>.</em>
            </h2>
            <p className="sub reveal">
              Caught in action. From match point to post-game chills. This is what
              the FORT lifestyle looks like.
            </p>
          </div>

          <div className="zoomer" ref={zoomer}>
            <div className="zoomer-inner" ref={zoomInner}>
              {GALLERY.map((src, i) => (
                <div className="zoom-img" key={src}>
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="100vw"
                    priority={i === 0}
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ COACHES ═══════════ */}
        <section className="coaches" id="coaches">
          <div className="container gallery-head">
            <h2 className="h-title reveal">
              COACHES<em>.</em>
            </h2>
            <p className="sub reveal">
              Expert guidance for every level. From technical drills to match
              strategy, meet the team that will take your game to the next level
            </p>
          </div>

          <div className="coach-scroll" ref={coachScroll}>
            <div className="coach-inner" ref={coachInner}>
              {COACHES.map((c) => (
                <div className="coach-slide" data-side={c.side} key={c.name}>
                  <div className="coach-photo">
                    <Image
                      src={c.photo}
                      alt={c.name}
                      fill
                      sizes="(max-width: 900px) 100vw, 560px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <p className="coach-meta">
                    {c.years}
                    <br />
                    {c.role}
                  </p>
                </div>
              ))}

              <div className="coach-tabs" ref={coachTabsRef}>
                {COACHES.map((c, i) => (
                  <button
                    key={c.name}
                    className={i === activeCoach ? "is-active" : undefined}
                    onClick={() => jumpToCoach(i)}
                  >
                    {c.name}
                  </button>
                ))}
                <span className="coach-rail">
                  <span className="coach-rail-fill" ref={coachRail} />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ TESTIMONIALS ═══════════ */}
        <section className="testimonials" id="testimonials">
          <div className="testi-title">
            <h2 className="h-title small">
              WORDS FROM THE COURT<em>.</em>
            </h2>
            <p className="sub">Don&rsquo;t just take our word for it</p>
          </div>

          <div className="container testi-cards">
            <div className="testi-row two">
              <Card t={TESTIMONIALS[0]} />
              <Card t={TESTIMONIALS[1]} offset />
            </div>
            <div className="testi-row one">
              <Card t={TESTIMONIALS[2]} />
            </div>
            <div className="testi-row two">
              <Card t={TESTIMONIALS[3]} offset />
              <Card t={TESTIMONIALS[4]} />
            </div>
          </div>
        </section>

        {/* ═══════════ PRICING ═══════════ */}
        <section className="pricing" id="pricing">
          <div className="container pricing-grid">
            <div className="pricing-copy">
              <h2 className="h-title small reveal">
                UNLOCK THE COURT<em>.</em>
              </h2>
              <p className="sub left reveal">
                Caught in action. From match point to post-game chills. This is
                what the FORT lifestyle looks like.
              </p>
              <a className="btn btn-lime reveal" href="#footer">
                CONTACT US
                <i className="btn-ico" aria-hidden="true" />
              </a>
            </div>

            <div className="pricing-cards">
              <article className="pcard pcard-white">
                <h3>CLUB MEMBER</h3>
                <p className="price">&#8358;120,000</p>
                <p className="pcopy">
                  For the obsessed. Get <strong>50% OFF</strong> all bookings,
                  14-day priority access, free racket stringing, and entry to
                  exclusive leagues.
                </p>
              </article>
              <article className="pcard pcard-blue">
                <h3>PAY &amp; PLAY</h3>
                <p className="price">&#8358;8,000</p>
                <p className="pcopy">
                  No strings attached. Book up to 7 days in advance. Includes full
                  access to the lounge, showers, and free parking.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="footer" id="footer">
          <div className="container footer-grid">
            <div>
              <p className="flabel">Quick Links</p>
              <nav className="flinks">
                {NAV.map((item) => (
                  <a key={item.href} href={item.href}>
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
            <div className="footer-contact">
              <p className="flabel">Email</p>
              <p className="fvalue">fort@abuja.com</p>
              <p className="flabel gap">Location</p>
              <p className="fvalue">Nigeria - Abuja - Maitama</p>
            </div>
          </div>

          <div className="footer-mark" aria-hidden="true">
            <span>F</span>
            <span className="footer-ball">
              <ParticleBall count={3200} />
            </span>
            <span>RT</span>
          </div>
        </footer>
      </main>

      <RacketCursor />
    </div>
  );
}

function Card({
  t,
  offset,
}: {
  t: (typeof TESTIMONIALS)[number];
  offset?: boolean;
}) {
  return (
    <article className={`tcard${offset ? " offset" : ""}`}>
      <p>{t.quote}</p>
      <footer>
        <Image src={t.avatar} alt="" width={50} height={75} />
        <span>{t.name}</span>
      </footer>
    </article>
  );
}
