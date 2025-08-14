import React, { useEffect, useState, useRef } from 'react';

const Navbar: React.FC = () => {
  const [opacity, setOpacity] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  
  // Refs for gooey animation
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  interface NavLink {
    name: string;
    href: string;
  }

  const navLinks: NavLink[] = [
    { name: 'Home', href: '/' },
    { name: 'Showcase', href: '#showcase' },
    { name: 'About', href: '#about' },
    { name: 'Reviews', href: '#reviews' },
  ];

  // Gooey animation configuration
  const animationTime: number = 600;
  const particleCount: number = 15;
  const particleDistances: number[] = [90, 10];
  const particleR: number = 100;
  const timeVariance: number = 300;
  const colors: number[] = [1, 2, 3, 1, 2, 3, 1, 4];

  // Gooey animation functions
  const noise = (n: number = 1): number => n / 2 - Math.random() * n;
  
  const getXY = (distance: number, pointIndex: number, totalPoints: number): [number, number] => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  interface Particle {
    start: [number, number];
    end: [number, number];
    time: number;
    scale: number;
    color: number;
    rotate: number;
  }

  const createParticle = (i: number, t: number, d: number[], r: number): Particle => {
    let rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  };

  const makeParticles = (element: HTMLElement): void => {
    const d = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty("--time", `${bubbleTime}ms`);
    
    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r);
      element.classList.remove("active");
      
      setTimeout(() => {
        const particle = document.createElement("span");
        const point = document.createElement("span");
        particle.classList.add("particle");
        particle.style.setProperty("--start-x", `${p.start[0]}px`);
        particle.style.setProperty("--start-y", `${p.start[1]}px`);
        particle.style.setProperty("--end-x", `${p.end[0]}px`);
        particle.style.setProperty("--end-y", `${p.end[1]}px`);
        particle.style.setProperty("--time", `${p.time}ms`);
        particle.style.setProperty("--scale", `${p.scale}`);
        particle.style.setProperty("--color", `var(--color-${p.color}, white)`);
        particle.style.setProperty("--rotate", `${p.rotate}deg`);
        point.classList.add("point");
        particle.appendChild(point);
        element.appendChild(particle);
        
        requestAnimationFrame(() => {
          element.classList.add("active");
        });
        
        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {
            // do nothing
          }
        }, t);
      }, 30);
    }
  };

  const updateEffectPosition = (element: HTMLElement): void => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();
    const styles: Partial<CSSStyleDeclaration> = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    
    Object.assign(filterRef.current.style, styles);
    Object.assign(textRef.current.style, styles);
    textRef.current.innerText = element.innerText;
  };

  const handleNavClick = (e: React.MouseEvent<HTMLLIElement>, index: number): void => {
    const liEl = e.currentTarget;
    
    setActiveIndex(index);
    updateEffectPosition(liEl);
    
    if (filterRef.current) {
      const particles = filterRef.current.querySelectorAll(".particle");
      particles.forEach((p) => filterRef.current?.removeChild(p));
    }
    
    if (textRef.current) {
      textRef.current.classList.remove("active");
      void textRef.current.offsetWidth;
      textRef.current.classList.add("active");
    }
    
    if (filterRef.current) {
      makeParticles(filterRef.current);
    }
  };

  const handleMobileNavClick = (href: string): void => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = (): void => {
      const scrollY = window.scrollY;
      const maxScroll = 500;
      const newOpacity = Math.min(scrollY / maxScroll, 1) * 1;
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;
    
    const activeLi = navRef.current.querySelectorAll("li")[activeIndex];
    if (activeLi) {
      updateEffectPosition(activeLi);
      textRef.current?.classList.add("active");
    }
    
    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll("li")[activeIndex];
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex]);

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <style>
        {`
          :root {
            --linear-ease: linear(0, 0.068, 0.19 2.7%, 0.804 8.1%, 1.037, 1.199 13.2%, 1.245, 1.27 15.8%, 1.274, 1.272 17.4%, 1.249 19.1%, 0.996 28%, 0.949, 0.928 33.3%, 0.926, 0.933 36.8%, 1.001 45.6%, 1.013, 1.019 50.8%, 1.018 54.4%, 1 63.1%, 0.995 68%, 1.001 85%, 1);
            --color-1: #FCD34D;
            --color-2: #FBBF24;
            --color-3: #F59E0B;
            --color-4: #EA580C;
          }
          
          html {
            scroll-padding-top: 96px;
          }
          
          .effect {
            position: absolute;
            opacity: 1;
            pointer-events: none;
            display: grid;
            place-items: center;
            z-index: 1;
          }
          .effect.text {
            color: white;
            transition: color 0.3s ease;
          }
          .effect.text.active {
            color: #EA580C;
            font-weight: 650;
            text-decoration: underline;
            text-decoration-color: #EA580C;
            text-underline-offset: 4px;
            text-decoration-thickness: 2px;
            text-decoration-style: wavy;
          }
          .effect.filter {
            filter: blur(7px) contrast(100) blur(0);
            mix-blend-mode: lighten;
          }
          .effect.filter::before {
            content: "";
            position: absolute;
            inset: -15px;
            z-index: -2;
            background: black;
          }
          .effect.filter::after {
            content: "";
            position: absolute;
            inset: 0;
            background: transparent;
            transform: scale(0);
            opacity: 0;
            z-index: -1;
            border-radius: 9999px;
            overflow: hidden !important;
          }
          .effect.active::after {
            animation: pill 0.3s ease both;
          }
          @keyframes pill {
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          .particle,
          .point {
            display: block;
            opacity: 0;
            width: 20px;
            height: 20px;
            border-radius: 9999px;
            transform-origin: center;
          }
          .particle {
            --time: 5s;
            position: absolute;
            top: calc(50% - 8px);
            left: calc(50% - 8px);
            animation: particle calc(var(--time)) ease 1 -350ms;
          }
          .point {
            background: var(--color);
            opacity: 1;
            animation: point calc(var(--time)) ease 1 -350ms;
          }
          @keyframes particle {
            0% {
              transform: rotate(0deg) translate(calc(var(--start-x)), calc(var(--start-y)));
              opacity: 1;
              animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
            }
            70% {
              transform: rotate(calc(var(--rotate) * 0.5)) translate(calc(var(--end-x) * 1.2), calc(var(--end-y) * 1.2));
              opacity: 1;
              animation-timing-function: ease;
            }
            85% {
              transform: rotate(calc(var(--rotate) * 0.66)) translate(calc(var(--end-x)), calc(var(--end-y)));
              opacity: 1;
            }
            100% {
              transform: rotate(calc(var(--rotate) * 1.2)) translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5));
              opacity: 1;
            }
          }
          @keyframes point {
            0% {
              transform: scale(0);
              opacity: 0;
              animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
            }
            25% {
              transform: scale(calc(var(--scale) * 0.25));
            }
            38% {
              opacity: 1;
            }
            65% {
              transform: scale(var(--scale));
              opacity: 1;
              animation-timing-function: ease;
            }
            85% {
              transform: scale(var(--scale));
              opacity: 1;
            }
            100% {
              transform: scale(0);
              opacity: 0;
            }
          }
          .nav-item.active {
            color: #EA580C !important;
            text-shadow: none;
          }
          .nav-item.active::after {
            opacity: 1;
            transform: scale(1);
          }
          .nav-item::after {
            content: "";
            position: absolute;
            inset: -1px;
            border-radius: 8px;
            background: transparent;
            opacity: 0;
            transform: scale(0);
            transition: all 0.3s ease;
            z-index: -1;
          }
        `}
      </style>
      
      <nav
        className="fixed top-0 left-0 w-full z-50 transition-all duration-300 h-22"
        style={{
          background: `linear-gradient(to bottom, rgba(0, 0, 0, ${opacity}), rgba(27, 28, 47, ${opacity}))`,
          boxShadow: opacity > 0 ? `0 4px 6px -1px rgba(0, 0, 0, ${opacity})` : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
          {/* Desktop Menu with Gooey Animation */}
          <div className="hidden sm:block relative" ref={containerRef}>
            <div className="flex relative" style={{ transform: "translate3d(0,0,0.01px)" }}>
              <ul
                ref={navRef}
                className="flex gap-10 list-none p-0 px-6 m-0 relative z-[3]"
                style={{
                  color: "white",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                }}
              >
                {navLinks.map((link, index) => (
                  <li
                    key={index}
                    className={`nav-item py-3 px-4 rounded-full relative cursor-pointer transition-[background-color_color_box-shadow] duration-300 ease shadow-[0_0_0.5px_1.5px_transparent] text-white uppercase text-base hover:text-amber-300 hover:shadow-lg ${
                      activeIndex === index ? "active" : ""
                    }`}
                    onClick={(e) => handleNavClick(e, index)}
                  >
                    <a href={link.href} className="outline-none">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <span className="effect filter" ref={filterRef} />
            <span className="effect text" ref={textRef} />
          </div>
          
          {/* Mobile Burger Icon */}
          <div className="sm:hidden flex items-center">
            <button onClick={toggleMenu} className="text-white focus:outline-none">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="sm:hidden">
            <ul className="flex flex-col items-center bg-[#1B1C2F] w-full py-6">
              {navLinks.map((link, index) => (
                <li key={index} className="py-3">
                  <a
                    href={link.href}
                    className="text-white hover:text-amber-300 transition-colors duration-300 uppercase text-base font-medium"
                    onClick={() => handleMobileNavClick(link.href)}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;