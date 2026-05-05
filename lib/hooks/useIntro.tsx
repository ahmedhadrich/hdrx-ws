'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface IntroContextValue {
  introComplete: boolean;
  setIntroComplete: (v: boolean) => void;
}

const IntroCtx = createContext<IntroContextValue>({
  introComplete: false,
  setIntroComplete: () => {},
});

export function IntroProvider({ children }: { children: ReactNode }) {
  const [introComplete, setIntroComplete] = useState(false);
  return (
    <IntroCtx.Provider value={{ introComplete, setIntroComplete }}>
      {children}
    </IntroCtx.Provider>
  );
}

export function useIntro(): IntroContextValue {
  return useContext(IntroCtx);
}
