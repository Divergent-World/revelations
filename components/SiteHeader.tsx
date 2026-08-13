import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Revelations home">
        <span>Revelations</span>
        <small>A Divergent World exhibition</small>
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/tapestries/1/">Movements</Link>
        <Link href="/revelation/">Read</Link>
        <a href="https://github.com/Divergent-World/revelations">Source</a>
      </nav>
    </header>
  );
}
