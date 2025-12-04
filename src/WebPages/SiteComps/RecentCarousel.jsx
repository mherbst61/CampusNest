// src/WebPages/SiteComps/RecentCarousel.jsx
import React, { useEffect, useState, useRef } from "react";

export default function RecentCarousel({
  items = [],
  extractImage = (x) => x?.image,
  extractAlt   = (x) => x?.title || "Image",
  interval = 3500,
  onActiveChange,
  onImageClick,            // <-- NEW
  heightClass = "h-72",
  rounded = "rounded-md",
}) {
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (!items?.length) return;
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, interval);
    return () => timer.current && clearInterval(timer.current);
  }, [items, interval]);

  useEffect(() => { onActiveChange?.(idx); }, [idx, onActiveChange]);

  if (!items?.length) {
    return (
      <div className={`flex ${heightClass} items-center justify-center border ${rounded} bg-gray-50 text-gray-500`}>
        No items yet
      </div>
    );
  }

  const imgUrl = extractImage(items[idx]);
  const alt = extractAlt(items[idx]) || "Image";

  return (
    <div className={`relative w-full overflow-hidden ${heightClass} ${rounded} border`}>
      <img
        src={imgUrl || "src/assets/No-Image-Placeholder.svg"}
        alt={alt}
        className="h-full w-full object-cover cursor-pointer"
        onClick={() => onImageClick?.(idx)}     // <-- NEW
        onError={(e) => { e.currentTarget.src = "src/assets/No-Image-Placeholder.svg"; }}
      />

      {/* dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            className={`h-2 w-2 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  );
}
