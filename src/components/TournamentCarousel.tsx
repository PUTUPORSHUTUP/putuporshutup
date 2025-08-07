import { useEffect, useState } from "react";

const posterImages = [
  "/posters/sunday_showdown_aug11.png",
  "/posters/sunday_showdown_aug4.png", 
  "/posters/sunday_showdown_july28.png",
  "/posters/sunday_showdown_fresh.png"
];

export default function TournamentCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % posterImages.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Featured Tournaments
        </h2>
        <div className="text-sm text-muted-foreground">
          Auto-rotating gallery
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg bg-card shadow-sm">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {posterImages.map((image, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <img
                src={image}
                alt={`Tournament poster ${index + 1}`}
                className="w-full h-64 md:h-80 lg:h-96 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => window.open('/tournaments', '_blank')}
              />
            </div>
          ))}
        </div>
        
        {/* Navigation dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {posterImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                current === index ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}