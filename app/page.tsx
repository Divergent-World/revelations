import Link from "next/link";

import { allTapestries, archiveUrl } from "@/lib/content";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">The Revelation to John</p>
        <h1>A prophecy in six movements</h1>
        <p className="hero-copy">
          Ninety scenes follow John from Patmos through throne, judgment, dragon, Babylon, and the radiant city at the end of the world.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/tapestries/1/">Enter Movement I</Link>
          <Link className="button" href="/revelation/">Read Revelation</Link>
        </div>
      </section>

      <section className="tapestry-index" aria-labelledby="six-movements">
        <div className="section-heading">
          <p className="eyebrow">I — VI</p>
          <h2 id="six-movements">The six movements</h2>
        </div>
        <ol className="tapestry-list">
          {allTapestries.map((tapestry) => (
            <li key={tapestry.id}>
              <Link href={`/tapestries/${tapestry.id}/`}>
                <span className="roman">{tapestry.roman}</span>
                <span>
                  <strong>{tapestry.title}</strong>
                  <small>{tapestry.summary}</small>
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="archive-callout">
        <p className="eyebrow">Open archive</p>
        <h2>Keep the entire work.</h2>
        <p>The versioned release contains all 90 high-resolution originals, metadata, checksums, attribution, and license terms.</p>
        <div className="hero-actions">
          <a className="button button-primary" href={archiveUrl}>Download artwork v1</a>
          <a className="button" href="https://github.com/Divergent-World/revelations">Fork the source</a>
        </div>
      </section>
    </>
  );
}
