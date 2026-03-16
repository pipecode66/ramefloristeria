import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getHeroBannerImages, type HeroContent } from "./data/heroStore";

interface HeroProps {
  content: HeroContent;
}

export function Hero({ content }: HeroProps) {
  const bannerImages = useMemo(() => getHeroBannerImages(content), [content]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex((prev) => (prev >= bannerImages.length ? 0 : prev));
  }, [bannerImages.length]);

  const hasMultipleBanners = bannerImages.length > 1;
  const currentBanner = bannerImages[currentIndex] ?? bannerImages[0];

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? bannerImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === bannerImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section className="w-full md:px-20 lg:px-24 xl:px-28">
      <div className="relative w-full overflow-hidden aspect-[16/9] md:aspect-[16/7]">
        <img
          key={currentBanner}
          src={currentBanner}
          alt={`Banner principal RAME ${currentIndex + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center center" }}
        />

        {hasMultipleBanners && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Ver banner anterior"
              className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "rgba(253,246,240,0.92)",
                color: "#4a6741",
                border: "1px solid rgba(232,213,196,0.9)",
                cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={goToNext}
              aria-label="Ver siguiente banner"
              className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "rgba(253,246,240,0.92)",
                color: "#4a6741",
                border: "1px solid rgba(232,213,196,0.9)",
                cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
