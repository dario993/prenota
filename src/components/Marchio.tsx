// Marchio di Prenota: un sipario aperto (mantovana e due teli) nel colore principale.
export function Marchio({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden className="shrink-0">
      <rect width="28" height="28" rx="7" className="fill-accent" />
      <path d="M5 6h18v2.5H5z" fill="#fff" />
      <path d="M5 9h7c0 6-2 10-5 13H5zM23 9h-7c0 6 2 10 5 13h2z" fill="#fff" opacity=".92" />
    </svg>
  );
}
