// Deno global types for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare global {
  const Deno: typeof Deno;
}
