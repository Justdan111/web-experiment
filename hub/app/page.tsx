import { Featured } from "./components/Featured";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Nav } from "./components/Nav";
import { Playground } from "./components/Playground";
import { Services } from "./components/Services";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <Featured />
        <Playground />
        <Services />
      </main>
      <Footer />
    </>
  );
}
