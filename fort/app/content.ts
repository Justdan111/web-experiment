import { asset } from "./lib/base-path";

export const NAV = [
  { label: "THE CLUB", href: "#club" },
  { label: "COMMUNITY", href: "#community" },
  { label: "COACHES", href: "#coaches" },
  { label: "TESTIMONIALS", href: "#testimonials" },
  { label: "PRICING", href: "#pricing" },
];

export const STATS = [
  { value: 8, suffix: "", label: "WORLD CLASS COURTS", big: false },
  { value: 500, suffix: "+", label: "ACTIVE MEMBERS", big: true },
  { value: 21, suffix: "+", label: "MONTHLY EVENTS", big: true },
];

export const GALLERY = [
  asset("/media/g1.webp"),
  asset("/media/g2.webp"),
  asset("/media/g3.webp"),
  asset("/media/g4.webp"),
  asset("/media/g5.webp"),
  asset("/media/g6.webp"),
  asset("/media/g7.webp"),
];

export type Coach = {
  name: string;
  photo: string;
  years: string;
  role: string;
  side: "left" | "right";
};

export const COACHES: Coach[] = [
  {
    name: "Chidi",
    photo: asset("/media/coach1.webp"),
    years: "7+ Years Experience",
    role: "Junior Academy Specialist",
    side: "right",
  },
  {
    name: "Amaka",
    photo: asset("/media/coach2.webp"),
    years: "12+ Years Experience",
    role: "Former ITF Pro Player",
    side: "left",
  },
  {
    name: "Tunde",
    photo: asset("/media/coach3.webp"),
    years: "6+ Years Experience",
    role: "High Performance & Fitness",
    side: "right",
  },
  {
    name: "Zainab",
    photo: asset("/media/coach4.webp"),
    years: "9+ Years Experience",
    role: "Technique Correction Expert",
    side: "left",
  },
  {
    name: "Emeka",
    photo: asset("/media/coach5.webp"),
    years: "10+ Years Experience",
    role: "Match Strategy & Tactics",
    side: "right",
  },
];

export type Testimonial = { quote: string; name: string; avatar: string };

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Honestly, I stay for an hour even after my match ends. The atmosphere is electric. Whether you win or lose, grabbing a chapman at the lounge and watching the other matches is just a vibe. It feels like a real community, not just a rental facility.",
    name: "Kelechi",
    avatar: asset("/media/av3.jpg"),
  },
  {
    quote:
      "I've played on courts all over Abuja, but nothing compares to FORT. The acrylic hard courts make the bounce consistent, and the LED floodlights at night are perfect—no glare, no shadows. If you take your game seriously, this is where you play.",
    name: "Ibrahim",
    avatar: asset("/media/av4.jpg"),
  },
  {
    quote:
      "I was worried my son would get bored, but Coach Emeka is incredible with the kids. He doesn't just teach them how to hold a racket; he teaches them discipline and teamwork while making it fun. Now, my son begs me to bring him to practice early!",
    name: "Ngozi",
    avatar: asset("/media/av1.jpg"),
  },
  {
    quote:
      "Joining as a member was a no-brainer. The priority booking is a lifesaver for getting those prime 6 PM slots, and the 50% discount means I can play three times a week without breaking the bank. Best investment I've made for my fitness.",
    name: "Musa",
    avatar: asset("/media/av2.jpg"),
  },
  {
    quote:
      "The Ladies' Tuesday Social is the highlight of my week. It's the perfect mix of a serious workout and a great hangout. I came here not knowing anyone, and now I have a whole new group of friends. The coffee at the lounge afterwards is a must!",
    name: "Adaeze",
    avatar: asset("/media/av5.jpg"),
  },
];
