export function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      <div className="ambient-bg__layer ambient-bg__layer--a" />
      <div className="ambient-bg__layer ambient-bg__layer--b" />
      <div className="ambient-bg__layer ambient-bg__layer--c" />
      <div className="ambient-bg__grain" />
    </div>
  );
}
