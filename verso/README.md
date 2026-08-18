# Verso

The homepage of a fictional Kyoto design studio, built as a Next.js + GSAP
study of `besign.co/en/`. The layout, type system, and scroll choreography
follow the source closely — that is the thing being learned. Every word,
colour, project, and image is original.

## Running

```bash
pnpm install
pnpm dev      # localhost:3000
pnpm test     # vitest, pure logic only
pnpm build
```

## Structure

- `app/content/` — all copy and data, three typed modules
- `app/lib/` — pure logic: rail geometry, clock formatting. Tested.
- `app/components/` — the six sections
- `public/media/` — imagery, credited in `CREDITS.md`

## Notes

The highlight rail is CSS 3D, not WebGL: a perspective stage, a rotated
rail, cards flat at z=0 letting the projection supply depth. Each card
wraps independently so the loop has no visible seam.

Animation is verified in a browser, not in assertions — asserting on GSAP
tween state produces tests that pass while the page looks wrong. The logic
worth testing lives in `app/lib/`.

Routes other than `/` do not exist in this phase. Nav items, "View All",
and cards render fully styled but do not navigate.
