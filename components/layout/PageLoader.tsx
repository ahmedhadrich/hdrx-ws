import { Loader } from '@/components/ui/Loader';

interface PageLoaderProps {
  label?: string;
}

/**
 * Full-viewport loading overlay. Rendered by route-level `loading.tsx`
 * Suspense boundaries so the geometric loader shows whenever a page (or its
 * server data) is streaming in.
 */
export function PageLoader({ label }: PageLoaderProps) {
  return (
    <div className="page-loader">
      <Loader label={label} />
    </div>
  );
}
