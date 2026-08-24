import type { NewsItem } from "./types";
import { asset } from "../lib/base-path";

export const NEWS: NewsItem[] = [
  {
    slug: "walk-lisbon",
    category: "VERSO WALK",
    date: "3/14/26",
    headline: "Verso Walk Lisbon: light, tile, and repetition",
    image: asset("/media/news/walk-lisbon.jpg"),
    accent: "--mark",
  },
  {
    slug: "walk-kyoto",
    category: "VERSO WALK",
    date: "11/2/25",
    headline: "Verso Walk Kyoto: on restraint",
    image: asset("/media/news/walk-kyoto.jpg"),
    accent: "--mark",
  },
  {
    slug: "halide-partnership",
    category: "PRACTICE",
    date: "9/18/25",
    headline: "Verso partners with Halide Capital on a full rebrand",
    image: asset("/media/news/halide-partnership.jpg"),
    accent: "--accent-practice",
  },
  {
    slug: "field-residency",
    category: "INDEX",
    date: "7/25/25",
    headline: "Verso Field opens applications for the 2026 residency",
    image: asset("/media/news/field-residency.jpg"),
    accent: "--accent-index",
  },
];
