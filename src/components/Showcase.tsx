import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { gsap } from "gsap";

import image1 from '../images/image1.jpg';
import image2 from '../images/image2.jpg';
import image3 from '../images/image3.jpg';
import image4 from '../images/image4.jpg';
import image5 from '../images/image5.jpg';
import image6 from '../images/image6.jpg';
import image7 from '../images/image7.jpg';
import image8 from '../images/image8.jpg';
import image9 from '../images/image9.jpg';
import image10 from '../images/image10.jpg';
import image11 from '../images/image11.jpg';
import image12 from '../images/image12.jpg';
import image13 from '../images/image13.jpg';
import image14 from '../images/image14.jpg';
import image15 from '../images/image15.jpg';
import image16 from '../images/image16.jpg';
import image17 from '../images/image17.jpg';
import image19 from '../images/image19.jpg';

const useMedia = (
  queries: string[],
  values: number[],
  defaultValue: number
): number => {
  const [value, setValue] = useState<number>(defaultValue);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === "undefined" || !window.matchMedia) return;

    const get = () =>
      values[queries.findIndex((q) => window.matchMedia(q).matches)] ?? defaultValue;

    setValue(get());

    const handler = () => setValue(get());
    const mediaQueries = queries.map((q) => window.matchMedia(q));
    
    mediaQueries.forEach((mq) => {
      if (mq && typeof mq.addEventListener === 'function') {
        mq.addEventListener("change", handler);
      }
    });

    return () => {
      mediaQueries.forEach((mq) => {
        if (mq && typeof mq.removeEventListener === 'function') {
          mq.removeEventListener("change", handler);
        }
      });
    };
  }, [queries, values, defaultValue, isClient]);

  return value;
};

const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useLayoutEffect(() => {
    if (!isClient || !ref.current || typeof ResizeObserver === 'undefined') return;
    
    let timeoutId: NodeJS.Timeout;
    const ro = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect) {
        // Debounce resize updates
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const { width, height } = entry.contentRect;
          setSize((prev) => {
            if (Math.abs(prev.width - width) > 5 || Math.abs(prev.height - height) > 5) {
              return { width, height };
            }
            return prev;
          });
        }, 16); // ~60fps
      }
    });
    
    ro.observe(ref.current);
    return () => {
      clearTimeout(timeoutId);
      if (ro) {
        ro.disconnect();
      }
    };
  }, [isClient]);

  return [ref, size] as const;
};

const preloadImages = async (urls: string[]): Promise<void> => {
  // Batch load images in smaller groups to prevent browser overload
  const batchSize = 5;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(
      batch.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = img.onerror = () => resolve();
          })
      )
    );
  }
};

export interface ShowcaseItem {
  id: string;
  img: string;
  modelName: string;
  madeFor: string;
  description: string;
  height: number;
}

interface GridItem extends ShowcaseItem {
  x: number;
  y: number;
  w: number;
  h: number;
  containerWidth: number;
}

interface ShowcaseProps {
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: "bottom" | "top" | "left" | "right" | "center" | "random";
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
}

const Showcase: React.FC<ShowcaseProps> = ({
  ease = "power3.out",
  duration = 0.4, // Reduced from 0.6 for snappier feel
  stagger = 0.03, // Reduced from 0.05
  animateFrom = "bottom",
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = false, // Disabled by default for better performance
  colorShiftOnHover = false,
}) => {
  const items: ShowcaseItem[] = useMemo(() => [
    { id: '2', img: image2.src, modelName: 'Ceramic Vase Collection', madeFor: 'Modern Art Gallery', description: 'An elegant sculptural vase featuring organic curves and hand-glazed amber finish that captures light beautifully.', height: 220 },
    { id: '1', img: image1.src, modelName: 'Artisan Bowl Series', madeFor: 'Boutique Restaurant', description: 'A unique handcrafted bowl showcasing traditional pottery techniques with contemporary geometric patterns.', height: 400 },
    { id: '15', img: image15.src, modelName: 'Minimalist Sculpture', madeFor: 'Private Collector', description: 'A compact sculptural piece with sleek lines that embodies the essence of modern ceramic artistry.', height: 660 },
    { id: '17', img: image17.src, modelName: 'Tall Garden Vessel', madeFor: 'Landscape Designer', description: 'A striking vertical ceramic piece designed for outdoor spaces, featuring weather-resistant glazing.', height: 300 },
    { id: '3', img: image3.src, modelName: 'Textured Wall Art', madeFor: 'Interior Design Firm', description: 'A robust ceramic wall installation with innovative textural elements and earthy glazing techniques.', height: 370 },
    { id: '4', img: image4.src, modelName: 'Functional Art Pieces', madeFor: 'Luxury Hotel Chain', description: 'A sleek ceramic design combining functionality with artistic expression, crafted from premium clay materials.', height: 550 },
    { id: '7', img: image7.src, modelName: 'Architectural Ceramics', madeFor: 'Corporate Office', description: 'A tall ceramic installation featuring unique structural elements that complement modern architectural spaces.', height: 425 },
    { id: '9', img: image9.src, modelName: 'Decorative Pottery', madeFor: 'Art Collector', description: 'A delicate ceramic piece with intricate surface patterns inspired by natural forms and textures.', height: 380 },
    { id: '11', img: image11.src, modelName: 'Contemporary Vessels', madeFor: 'Design Museum', description: 'A futuristic ceramic form that pushes the boundaries of traditional pottery with innovative glazing techniques.', height: 290 },
    { id: '5', img: image5.src, modelName: 'Studio Collection', madeFor: 'Art Studio', description: 'A compact ceramic sculpture with bold aesthetic choices that showcase experimental firing techniques.', height: 400 },
    { id: '12', img: image12.src, modelName: 'Classic Ceramics', madeFor: 'Heritage Foundation', description: 'A timeless ceramic piece that bridges traditional craftsmanship with contemporary artistic vision.', height: 295 },
    { id: '13', img: image13.src, modelName: 'Artistic Expression', madeFor: 'Gallery Exhibition', description: 'A unique ceramic sculpture with artistic flair, featuring experimental glazing and form exploration.', height: 260 },
    { id: '14', img: image14.src, modelName: 'Large Scale Installation', madeFor: 'Public Art Commission', description: 'A substantial ceramic work with modern interpretation of traditional pottery forms and glazing.', height: 660 },
    { id: '16', img: image16.src, modelName: 'Detailed Ceramics', madeFor: 'Private Commission', description: 'An intricately detailed ceramic piece showcasing masterful craftsmanship and attention to surface treatment.', height: 250 },
    { id: '8', img: image8.src, modelName: 'Colorful Pottery', madeFor: 'Children\'s Museum', description: 'A medium-sized ceramic work featuring vibrant glazes that bring joy and wonder to educational spaces.', height: 275 },
    { id: '10', img: image10.src, modelName: 'Minimalist Forms', madeFor: 'Design Consultant', description: 'A clean-lined ceramic sculpture that embodies minimalist principles while showcasing material beauty.', height: 350 },
    { id: '19', img: image19.src, modelName: 'Intricate Patterns', madeFor: 'Craft Enthusiast', description: 'A small ceramic masterpiece featuring complex surface patterns achieved through specialized glazing techniques.', height: 290 },
    { id: '6', img: image6.src, modelName: 'Monumental Ceramics', madeFor: 'Sculpture Park', description: 'A large-scale ceramic installation demonstrating detailed craftsmanship suitable for outdoor exhibition.', height: 300 },
  ], []);

  const columns = useMedia(
    [
      "(min-width:1500px)",
      "(min-width:1000px)",
      "(min-width:768px)",
      "(min-width:400px)",
    ],
    [5, 4, 3, 2],
    1
  );

  const isMobile = useMedia(["(max-width: 767px)"], [1], 0) === 1;
  const [visibleItems, setVisibleItems] = useState(6);
  const [containerRef, { width: containerWidth, height: containerHeight }] = useMeasure<HTMLDivElement>();
  const [imagesReady, setImagesReady] = useState(false);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Refs for performance optimization
  const gridItemsRef = useRef<{ items: GridItem[]; containerHeight: number }>({ items: [], containerHeight: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset visible items when switching between mobile/desktop
  useEffect(() => {
    if (!isMobile) {
      setVisibleItems(items.length);
    } else {
      setVisibleItems(6);
    }
  }, [isMobile, items.length]);

  const displayedItems = useMemo(() => {
    return isMobile ? items.slice(0, visibleItems) : items;
  }, [items, visibleItems, isMobile]);

  const getInitialPosition = useCallback((item: GridItem) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: item.x, y: item.y };

    let direction = animateFrom;
    if (animateFrom === "random") {
      const dirs = ["top", "bottom", "left", "right"];
      direction = dirs[Math.floor(Math.random() * dirs.length)] as typeof animateFrom;
    }

    switch (direction) {
      case "top": return { x: item.x, y: -200 };
      case "bottom": return { x: item.x, y: containerHeight + 200 };
      case "left": return { x: -200, y: item.y };
      case "right": return { x: containerWidth + 200, y: item.y };
      case "center":
        return {
          x: containerWidth / 2 - item.w / 2,
          y: containerHeight / 2 - item.h / 2,
        };
      default: return { x: item.x, y: item.y + 100 };
    }
  }, [animateFrom, containerWidth, containerHeight, containerRef]);

  useEffect(() => {
    // Load images in batches for better performance
    preloadImages(items.map((i) => i.img)).then(() => setImagesReady(true));
  }, [items]);

  const grid = useMemo(() => {
    if (!containerWidth) return { items: [] as GridItem[], containerHeight: 0 };
    
    // Only recalculate if items changed significantly
    if (gridItemsRef.current.items.length === displayedItems.length && 
        Math.abs(gridItemsRef.current.items[0]?.containerWidth - containerWidth) < 10) {
      return { items: gridItemsRef.current.items, containerHeight: gridItemsRef.current.containerHeight };
    }

    const colHeights = new Array(columns).fill(0);
    const gap = 16;
    const totalGaps = (columns - 1) * gap;
    const columnWidth = (containerWidth - totalGaps) / columns;

    const itemsWithPositions: GridItem[] = displayedItems.map((child) => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (columnWidth + gap);
      const height = isMobile ? Math.min(child.height / 2, 280) : child.height / 2;
      const y = colHeights[col];
      colHeights[col] += height + gap;
      return { ...child, x, y, w: columnWidth, h: height, containerWidth };
    });

    const maxHeight = Math.max(...colHeights);
    const result = { items: itemsWithPositions, containerHeight: maxHeight };
    gridItemsRef.current = result;
    
    return result;
  }, [columns, displayedItems, containerWidth, isMobile]);

  const hasMounted = useRef(false);

  useLayoutEffect(() => {
    if (!imagesReady || !isClient) return;

    // Cancel any existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      // Kill existing timeline to prevent conflicts
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      const tl = gsap.timeline();
      timelineRef.current = tl;

      grid.items.forEach((item, index) => {
        const selector = `[data-key="${item.id}"]`;
        const animProps = { 
          x: item.x, 
          y: item.y, 
          width: item.w, 
          height: item.h,
          force3D: true // Enable GPU acceleration
        };

        if (!hasMounted.current) {
          const start = getInitialPosition(item);
          tl.fromTo(
            selector,
            {
              opacity: 0,
              x: start.x,
              y: start.y,
              width: item.w,
              height: item.h,
              force3D: true,
              ...(blurToFocus && { filter: "blur(10px)" }),
            },
            {
              opacity: 1,
              ...animProps,
              ...(blurToFocus && { filter: "blur(0px)" }),
              duration: 0.6,
              ease: "power3.out",
            },
            index * stagger
          );
        } else {
          if (flippedCard !== item.id) {
            tl.to(selector, {
              ...animProps,
              scale: 1,
              zIndex: 1,
              duration: duration * 0.8, // Slightly faster for repositioning
              ease,
              overwrite: "auto",
            }, 0);
          }
        }
      });

      hasMounted.current = true;
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [grid.items, imagesReady, stagger, getInitialPosition, blurToFocus, duration, ease, flippedCard, isClient]);

  const handleMouseEnter = useCallback((id: string, element: HTMLElement) => {
    if (scaleOnHover && !flippedCard) {
      gsap.to(`[data-key="${id}"]`, {
        scale: hoverScale,
        duration: 0.2, // Faster hover animation
        ease: "power2.out",
        force3D: true,
      });
    }
    if (colorShiftOnHover && !flippedCard) {
      const overlay = element.querySelector(".color-overlay") as HTMLElement;
      if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.2 });
    }
  }, [scaleOnHover, flippedCard, hoverScale, colorShiftOnHover]);

  const handleMouseLeave = useCallback((id: string, element: HTMLElement) => {
    if (scaleOnHover && !flippedCard) {
      gsap.to(`[data-key="${id}"]`, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
        force3D: true,
      });
    }
    if (colorShiftOnHover && !flippedCard) {
      const overlay = element.querySelector(".color-overlay") as HTMLElement;
      if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.2 });
    }
  }, [scaleOnHover, flippedCard, colorShiftOnHover]);

  const handleCardClick = useCallback((id: string) => {
    const cardElement = document.querySelector(`[data-key="${id}"]`) as HTMLElement;
    if (!cardElement || !containerRef.current) return;

    const isExpanding = flippedCard !== id;

    if (isExpanding) {
      const containerBounds = containerRef.current.getBoundingClientRect();
      const targetWidth = isMobile ? Math.min(containerBounds.width - 32, 350) : 420;
      const targetHeight = isMobile ? Math.min(containerBounds.height - 100, 280) : 320;
      const centerX = containerBounds.width / 2 - targetWidth / 2;
      const centerY = containerBounds.height / 2 - targetHeight / 2;

      gsap.to(cardElement, {
        x: centerX,
        y: centerY,
        width: targetWidth,
        height: targetHeight,
        zIndex: 999,
        duration: 0.4, // Faster card flip
        ease: "power3.inOut",
        force3D: true,
      });
    } else {
      const gridItem = grid.items.find((item) => item.id === id);
      if (!gridItem) return;

      gsap.to(cardElement, {
        x: gridItem.x,
        y: gridItem.y,
        width: gridItem.w,
        height: gridItem.h,
        zIndex: 1,
        duration: 0.4,
        ease: "power3.inOut",
        force3D: true,
      });
    }

    setFlippedCard(isExpanding ? id : null);
  }, [flippedCard, grid.items, isMobile, containerRef]);

  const handleShowMore = useCallback(() => {
    const currentVisible = visibleItems;
    const newVisible = Math.min(visibleItems + 6, items.length);
    setVisibleItems(newVisible);

    // Animate in the new items with better performance
    setTimeout(() => {
      const newItems = items.slice(currentVisible, newVisible);
      const tl = gsap.timeline();
      
      newItems.forEach((item, index) => {
        const selector = `[data-key="${item.id}"]`;
        tl.fromTo(
          selector,
          {
            opacity: 0,
            scale: 0.9,
            force3D: true,
            ...(blurToFocus && { filter: "blur(10px)" }),
          },
          {
            opacity: 1,
            scale: 1,
            force3D: true,
            ...(blurToFocus && { filter: "blur(0px)" }),
            duration: 0.4,
            ease: "power3.out",
          },
          index * 0.05
        );
      });
    }, 50);
  }, [visibleItems, items, blurToFocus]);

  // Optimized click outside handler
  useEffect(() => {
    if (!flippedCard) return;

    const handleClickOutside = (e: MouseEvent) => {
      const flippedEl = document.querySelector(`[data-key="${flippedCard}"]`);
      if (flippedEl && !flippedEl.contains(e.target as Node)) {
        const item = grid.items.find(i => i.id === flippedCard);
        if (!item) return;

        gsap.to(flippedEl, {
          x: item.x,
          y: item.y,
          width: item.w,
          height: item.h,
          zIndex: 1,
          duration: 0.4,
          ease: "power3.inOut",
          force3D: true,
        });

        setFlippedCard(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [flippedCard, grid.items]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <section className="min-h-screen py-20 px-6" id="showcase">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-4">
            Portfolio Gallery
          </h2>
          <div className="w-80 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto rounded-full mb-8"></div>
          <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
            Explore Elena&#39;s diverse collection of ceramic artworks, from intimate sculptural pieces to large-scale 
            installations. Each creation tells a unique story through clay, fire, and artistic vision.
          </p>
        </div>
        
        <div 
          ref={containerRef} 
          className="relative w-full min-h-[500px]"
          style={{ height: grid.containerHeight > 0 ? `${grid.containerHeight}px` : 'auto' }}
        >
          {grid.items.map((item) => (
            <div
              key={item.id}
              data-key={item.id}
              className="absolute cursor-pointer transform-gpu will-change-transform"
              style={{ 
                willChange: "transform, width, height, opacity",
                transform: "translate3d(0,0,0)" // Force hardware acceleration
              }}
              onClick={() => handleCardClick(item.id)}
              onMouseEnter={(e) => handleMouseEnter(item.id, e.currentTarget)}
              onMouseLeave={(e) => handleMouseLeave(item.id, e.currentTarget)}
            >
              <div className={`card ${flippedCard === item.id ? "flipped" : ""}`}>
                <div
                  className="card-face front"
                  style={{
                    backgroundImage: `url(${item.img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {colorShiftOnHover && (
                    <div className="color-overlay absolute inset-0 rounded-[10px] bg-gradient-to-tr from-amber-500/30 to-orange-500/30 opacity-0 pointer-events-none" />
                  )}
                </div>
                <div className="card-face back">
                  <div className="card-content">
                    <h3 className="card-title">{item.modelName}</h3>
                    <div className="card-client">
                      <span className="client-label">Commissioned by:</span>
                      <span className="client-name">{item.madeFor}</span>
                    </div>
                    <p className="card-description">{item.description}</p>
                  </div>
                </div>
              </div>
              <style jsx>{`
                .card {
                  transform-style: preserve-3d;
                  transition: transform 0.4s ease-out;
                  position: relative;
                  width: 100%;
                  height: 100%;
                  transform: translate3d(0,0,0);
                }
                .card.flipped {
                  transform: rotateY(180deg);
                }
                .card-face {
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  border-radius: 12px;
                  backface-visibility: hidden;
                  box-shadow: rgba(0, 0, 0, 0.4) 0 8px 32px -8px, rgba(251, 191, 36, 0.1) 0 0 60px -10px;
                  overflow: hidden;
                  transform: translate3d(0,0,0);
                }
                .back {
                  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                  border: 1px solid #334155;
                  transform: rotateY(180deg);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 0;
                }
                .card-content {
                  padding: ${isMobile ? '1rem' : '1.5rem'};
                  text-align: center;
                  height: 100%;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  gap: ${isMobile ? '0.5rem' : '0.75rem'};
                }
                .card-title {
                  font-size: ${isMobile ? '1.5rem' : '2rem'};
                  font-weight: 700;
                  background: linear-gradient(135deg, #fbbf24, #f97316);
                  -webkit-background-clip: text;
                  background-clip: text;
                  -webkit-text-fill-color: transparent;
                  margin-bottom: 0.5rem;
                  line-height: 1.3;
                }
                .card-client {
                  display: flex;
                  flex-direction: column;
                  gap: 0.25rem;
                  margin-bottom: 0.5rem;
                }
                .client-label {
                  font-size: ${isMobile ? '0.8rem' : '0.9rem'};
                  color: #94a3b8;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                }
                .client-name {
                  font-size: ${isMobile ? '1rem' : '1.25rem'};
                  color: #f59e0b;
                  font-weight: 600;
                }
                .card-description {
                  font-size: ${isMobile ? '0.9rem' : '1rem'};
                  color: #e2e8f0;
                  line-height: 1.4;
                  margin: 0;
                  text-align: left;
                  overflow-wrap: break-word;
                }
              `}</style>
            </div>
          ))}
        </div>

        {/* Show More Button - Only visible on mobile when there are more items */}
        {isMobile && visibleItems < items.length && (
          <div className="flex justify-center mt-12">
            <button
              onClick={handleShowMore}
              className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-2">
                Show More Pieces
                <svg 
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Showcase;