// troika-three-text ships no types; only the builder config is imported directly (drei wraps the rest)
declare module 'troika-three-text' {
  export function configureTextBuilder(config: { useWorker?: boolean }): void;
}
