import Nav from "./components/Nav";
import Hero from "./components/Hero";
import HighlightRail from "./components/HighlightRail";
import WorkSection from "./components/WorkSection";
import { FIELD, PRACTICE } from "./content/site";
import { FIELD_WORKS, PRACTICE_WORKS } from "./content/works";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HighlightRail />
        <WorkSection
          label={FIELD.label}
          accent={FIELD.accent}
          statement={FIELD.statement}
          works={FIELD_WORKS}
          weights="1fr 1fr 2fr"
        />
        <WorkSection
          label={PRACTICE.label}
          accent={PRACTICE.accent}
          statement={PRACTICE.statement}
          works={PRACTICE_WORKS}
          weights="2fr 1fr 1fr"
        />
      </main>
    </>
  );
}
