import ExperimentCard from "./components/ExperimentCard";
import { experiments } from "../content/experiments";

export default function Home() {
  return (
    <main className="shell">
      <header className="ix-head">
        <p className="label">Web experiments · {experiments.length} builds</p>
        <h1 className="ix-title">
          Sites built to
          <br />
          learn something
        </h1>
        <p className="ix-intro">
          Each one takes on a single problem — an editorial layout system, a booking flow
          with no server behind it — and runs it to completion. Every card opens a case
          study on how it was built; every case study links to the thing itself.
        </p>
      </header>

      <ul className="ix-grid">
        {experiments.map((e) => (
          <ExperimentCard key={e.slug} experiment={e} />
        ))}
      </ul>
    </main>
  );
}
