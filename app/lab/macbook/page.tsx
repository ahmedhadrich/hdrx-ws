import { notFound } from 'next/navigation';
import { MacbookLabClient } from './MacbookLabClient';

// Development-only workbench for the 3D MacBook. Not part of the site.
export const metadata = { robots: { index: false, follow: false } };

export default function MacbookLabPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <MacbookLabClient />;
}
