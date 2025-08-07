import { useEffect, useState } from "react";

type Poster = { src: string; label: string; href?: string };

const posters: Poster[] = [
  { src: "/posters/midweek_mayhem_fresh.png", label: "💥 Midweek Mayhem — Multiplayer Madness", href: "/tournaments/midweek-mayhem" },
  { src: "/posters/midweek_mayhem_aug7.png",  label: "💥 Midweek Mayhem – August 7", href: "/tournaments/midweek-mayhem" },
  { src: "/posters/midweek_mayhem_july31.png",label: "💥 Midweek Mayhem – July 31", href: "/tournaments/midweek-mayhem" }
];

export default function MidweekMayhemCarousel() {
  const [i, setI] = useState(0);
  const next = () => setI((p) => (p + 1) % posters.length);
  const prev = () => setI((p) => (p - 1 + posters.length) % posters.length);

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, []);

  const cur = posters[i];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 relative">
      <a href={cur.href || "#"} aria-label={cur.label}>
        <img src={cur.src} alt={cur.label} className="rounded-2xl shadow-lg w-full object-contain" />
      </a>

      <p className="text-center text-neutral-300 text-sm mt-2">{cur.label}</p>

      <div className="flex justify-center mt-3">
        <a
          href="/join-queue?midweek=1"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
        >
          🚀 Join Midweek Mayhem
        </a>
      </div>

      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-neutral-800/70 px-2 py-1 text-white rounded-full hover:bg-neutral-800"
        aria-label="Previous poster"
      >
        ◀
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-neutral-800/70 px-2 py-1 text-white rounded-full hover:bg-neutral-800"
        aria-label="Next poster"
      >
        ▶
      </button>
    </div>
  );
}