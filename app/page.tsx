import { HomeSwitch } from '@/components/HomeSwitch';

// Desktop: the MacBook brings its own frame (menu bar, dock, room). Phones and tablets: a swipe carousel.
export default function HomePage() {
  return (
    <main id="main">
      <HomeSwitch />
    </main>
  );
}
