import Nav from "./components/Nav";
import Hero from "./components/Hero";
import HighlightRail from "./components/HighlightRail";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HighlightRail />
      </main>
    </>
  );
}
