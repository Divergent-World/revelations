import Link from "next/link";

import { ArtworkImage } from "@/components/ArtworkImage";
import { allTapestries, archiveUrl, getScene, type Scene } from "@/lib/content";
import styles from "./page.module.css";

function requiredScene(id: string): Scene {
  const scene = getScene(id);
  if (!scene) throw new Error(`Homepage scene missing: ${id}`);
  return scene;
}

export default function HomePage() {
  const feature = requiredScene("T6-B03");
  const movements = allTapestries.map((tapestry) => ({
    tapestry,
    lead: requiredScene(tapestry.leadSceneId),
  }));

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className="eyebrow">The Revelation to John</p>
          <h1 id="home-title">A prophecy in six movements</h1>
          <p className={styles.intro}>Ninety illuminations follow John from Patmos through throne, judgment, dragon, Babylon, and the radiant city at the end of the world.</p>
          <div className={styles.actions}>
            <Link className="button button-primary" href="/tapestries/1/">Enter Movement I</Link>
            <Link className="button" href="/revelation/">Read Revelation</Link>
          </div>
          <dl className={styles.facts}>
            <div><dt>Movements</dt><dd>06</dd></div>
            <div><dt>Chapters</dt><dd>22</dd></div>
            <div><dt>Illuminations</dt><dd>90</dd></div>
          </dl>
        </div>
        <figure className={styles.feature}>
          <div className={styles.featureFrame}><ArtworkImage scene={feature} size="reader" eager /></div>
          <figcaption><span>Movement VI · {feature.id}</span><strong>{feature.title}</strong><small>{feature.displayReference}</small></figcaption>
        </figure>
      </section>

      <section className={styles.movements} aria-labelledby="six-movements">
        <header className={styles.sectionHeading}>
          <p className="eyebrow">I — VI</p>
          <h2 id="six-movements">The six movements</h2>
        </header>
        <ol className={styles.movementList}>
          {movements.map(({ tapestry, lead }) => (
            <li key={tapestry.id}>
              <Link href={`/tapestries/${tapestry.id}/`} aria-label={`Movement ${tapestry.roman}: ${tapestry.title}`}>
                <span className={styles.roman}>{tapestry.roman}</span>
                <span className={styles.movementCopy}><small>Movement {tapestry.roman}</small><strong>{tapestry.title}</strong><span>{tapestry.summary}</span></span>
                <span className={styles.movementArt}><ArtworkImage scene={lead} size="preview" /></span>
                <span className={styles.enter}>Enter movement <span aria-hidden="true">↗</span></span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.archive} aria-labelledby="archive-title">
        <p className="eyebrow">Open archive · Edition v1</p>
        <h2 id="archive-title">The whole prophecy, in your hands.</h2>
        <p className={styles.archiveIntro}>Export all 22 chapters and 90 unique illuminations as an editable Markdown book, or keep the complete archival artwork release.</p>
        <div className={styles.actions}>
          <a className="button button-primary" href="/export.md" download>export.md</a>
          <a className="button" href="/red-letter-reference.docx" download>red-letter reference</a>
          <a className="button" href={archiveUrl}>Download artwork v1</a>
          <a className="button" href="https://github.com/Divergent-World/revelations">Fork the source</a>
        </div>
        <p className={styles.exportNote}>Pandoc-ready · 22 chapters · 90 linked images · DOCX, EPUB, or PDF</p>
      </section>
    </div>
  );
}
