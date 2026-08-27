/** Fixed aurora wash behind all chrome — sits under transparent site-main. */
export function SiteAurora() {
  return (
    <div className="site-aurora" aria-hidden="true">
      <span className="site-aurora-a" />
      <span className="site-aurora-b" />
      <span className="site-aurora-c" />
    </div>
  );
}
