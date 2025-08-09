import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Poster = { src: string; label: string; href?: string };

const posters: Poster[] = [
  {
    src: "/posters/sunday_showdown_fresh.png", // 🔥 newest / featured
    label: "🔥 Sunday Showdown — Winner Takes All",
    href: "/tournaments"
  },
  { src: "/posters/sunday_showdown_aug11.png", label: "Sunday Showdown – August 11", href: "/tournaments" },
  { src: "/posters/sunday_showdown_aug4.png",  label: "Sunday Showdown – August 4",  href: "/tournaments" },
  { src: "/posters/sunday_showdown_july28.png",label: "Sunday Showdown – July 28",   href: "/tournaments" }
];

export default function TournamentCarousel() {
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
      <Link to={cur.href || "/tournaments"} aria-label={cur.label}>
        <img src={cur.src} alt={cur.label} className="rounded-2xl shadow-lg w-full object-contain" />
      </Link>

      <p className="text-center text-neutral-300 text-sm mt-2">{cur.label}</p>

      <div className="flex justify-center mt-3">
        <Link
          to="/tournaments"
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors"
        >
          ✅ Join Sunday Showdown
        </Link>
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