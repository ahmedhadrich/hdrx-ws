import { cn } from '@/lib/utils/cn';

interface LoaderProps {
  /** Accessible label announced to assistive tech. Defaults to "Loading". */
  label?: string;
  /** Extra classes for the outer group (e.g. spacing overrides). */
  className?: string;
}

/**
 * Geometric loader — three glyph shapes (circle, triangle, square) tracing
 * their outlines while a signal-orange dot travels each path.
 *
 * Pure CSS animation (see `globals.css` → "Geometric loader"), so it renders
 * fine as a server component and works inside Suspense fallbacks.
 *
 * Adapted from a Uiverse.io design by mobinkakei — recolored to the project
 * tokens (neutral outline + `--accent-signal` dot) per the design system.
 */
export function Loader({ label = 'Loading', className }: LoaderProps) {
  return (
    <div className={cn('loader-group', className)} role="status" aria-live="polite">
      <div className="loader" aria-hidden="true">
        <svg viewBox="0 0 80 80">
          <circle r="32" cy="40" cx="40" />
        </svg>
      </div>

      <div className="loader triangle" aria-hidden="true">
        <svg viewBox="0 0 86 80">
          <polygon points="43 8 79 72 7 72" />
        </svg>
      </div>

      <div className="loader" aria-hidden="true">
        <svg viewBox="0 0 80 80">
          <rect height="64" width="64" y="8" x="8" />
        </svg>
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
}
