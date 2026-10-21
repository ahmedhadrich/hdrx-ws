'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';
import { MobileHome } from '@/components/mobile/MobileHome';
import { MOBILE_QUERY } from '@/lib/utils/device';

// Desktop only: phones and tablets never download three.js, R3F or the glass shader.
// The placeholder is the empty dark room, so there's no flash before the stage arrives.
const MacbookStage = dynamic(() => import('@/components/screen/MacbookStage').then((m) => m.MacbookStage), {
  ssr: false,
  loading: () => <div className="mbp" />,
});

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

export function HomeSwitch() {
  // null on the server: render the mobile home, which CSS hides on desktop until JS decides
  const isMobile = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => null,
  );
  return isMobile === false ? <MacbookStage /> : <MobileHome />;
}
