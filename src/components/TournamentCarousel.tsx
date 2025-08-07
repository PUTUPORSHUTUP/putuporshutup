import { useEffect, useState } from "react"

const posterImages = [
  { src: "/posters/sunday_showdown_fresh.png", label: "🔥 This Sunday — Winner Takes All" },
  { src: "/posters/sunday_showdown_aug11.png", label: "Sunday Showdown – August 11" },
  { src: "/posters/sunday_showdown_aug4.png", label: "Sunday Showdown – August 4" },
  { src: "/posters/sunday_showdown_july28.png", label: "Sunday Showdown – July 28" }
]

export default function TournamentCarousel() {
  const [current, setCurrent] = useState(0)

  const goNext = () => setCurrent((prev) => (prev + 1) % posterImages.length)
  const goPrev = () => setCurrent((prev) => (prev - 1 + posterImages.length) % posterImages.length)

  useEffect(() => {
    const interval = setInterval(goNext, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 relative">
      <img
        src={posterImages[current].src}
        alt={posterImages[current].label}
        className="rounded-2xl shadow-lg w-full object-contain"
      />
      <p className="text-center text-neutral-300 text-sm mt-2">{posterImages[current].label}</p>

      <button
        onClick={goPrev}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-neutral-800 bg-opacity-60 px-2 py-1 text-white rounded-full hover:bg-opacity-90"
      >
        ◀
      </button>

      <button
        onClick={goNext}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-neutral-800 bg-opacity-60 px-2 py-1 text-white rounded-full hover:bg-opacity-90"
      >
        ▶
      </button>
    </div>
  )
}