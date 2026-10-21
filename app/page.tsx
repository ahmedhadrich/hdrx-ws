import { MacbookStage } from '@/components/screen/MacbookStage';

// A single screen that brings its own frame (menu bar, dock, room); no SiteChrome here
export default function HomePage() {
  return (
    <main id="main">
      <MacbookStage />
    </main>
  );
}
