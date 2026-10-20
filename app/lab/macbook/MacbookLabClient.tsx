'use client';

import dynamic from 'next/dynamic';

const MacbookLab = dynamic(() => import('@/components/three/MacbookLab'), { ssr: false });

export function MacbookLabClient() {
  return <MacbookLab />;
}
