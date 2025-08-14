import React, { useEffect, useRef, useCallback, useMemo } from "react";
import localAvatarImage from "../images/image.jpg";
import Image from "next/image";

interface AboutProps {
  avatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
}

const About: React.FC<AboutProps> = ({
  name = "Elena Vasquez",
  title = "Master Clay Artist & Sculptor",
  handle = "elenaclayworks",
  status = "Available for Commissions",
  contactText = "Get In Touch",
  showUserInfo = true,
  onContactClick = () => console.log("Contact clicked"),
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastUpdate = useRef<number>(0);

  const animationHandlers = useMemo(() => {
    let rafId: number | null = null;

    const updateCardTransform = (
      offsetX: number,
      offsetY: number,
      card: HTMLElement,
      wrap: HTMLElement
    ) => {
      const width = card.clientWidth;
      const height = card.clientHeight;
      const percentX = Math.min(Math.max((100 / width) * offsetX, 0), 100);
      const percentY = Math.min(Math.max((100 / height) * offsetY, 0), 100);
      const centerX = percentX - 50;
      const centerY = percentY - 50;

      wrap.style.setProperty("--pointer-x", percentX + "%");
      wrap.style.setProperty("--pointer-y", percentY + "%");
      wrap.style.setProperty("--pointer-from-center", Math.min(Math.hypot(percentY - 50, percentX - 50) / 50, 1).toString());
      wrap.style.setProperty("--pointer-from-top", (percentY / 100).toString());
      wrap.style.setProperty("--pointer-from-left", (percentX / 100).toString());
      wrap.style.setProperty("--rotate-x", (-(centerX / 12)).toFixed(3) + "deg");
      wrap.style.setProperty("--rotate-y", (centerY / 10).toFixed(3) + "deg");
    };

    const createSmoothAnimation = (
      duration: number,
      startX: number,
      startY: number,
      card: HTMLElement,
      wrap: HTMLElement
    ) => {
      const startTime = performance.now();
      const targetX = wrap.clientWidth / 2;
      const targetY = wrap.clientHeight / 2;

      const animationLoop = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(Math.max(elapsed / duration, 0), 1);
        const easedProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        const currentX = (targetX - startX) * easedProgress + startX;
        const currentY = (targetY - startY) * easedProgress + startY;

        updateCardTransform(currentX, currentY, card, wrap);

        if (progress < 1) {
          rafId = requestAnimationFrame(animationLoop);
        }
      };

      rafId = requestAnimationFrame(animationLoop);
    };

    return {
      updateCardTransform,
      createSmoothAnimation,
      cancelAnimation: () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
    };
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const now = performance.now();
      if (now - lastUpdate.current < 16) return;
      lastUpdate.current = now;

      const card = cardRef.current;
      const wrap = wrapRef.current;

      if (!card || !wrap || !animationHandlers) return;

      const rect = card.getBoundingClientRect();
      animationHandlers.updateCardTransform(
        event.clientX - rect.left,
        event.clientY - rect.top,
        card,
        wrap
      );
    },
    [animationHandlers]
  );

  const handlePointerEnter = useCallback(() => {
    const card = cardRef.current;
    const wrap = wrapRef.current;

    if (!card || !wrap || !animationHandlers) return;

    animationHandlers.cancelAnimation();
    wrap.classList.add("active");
    card.classList.add("active");
  }, [animationHandlers]);

  const handlePointerLeave = useCallback(
    (event: PointerEvent) => {
      const card = cardRef.current;
      const wrap = wrapRef.current;

      if (!card || !wrap || !animationHandlers) return;

      animationHandlers.createSmoothAnimation(600, event.offsetX, event.offsetY, card, wrap);
      wrap.classList.remove("active");
      card.classList.remove("active");
    },
    [animationHandlers]
  );

  useEffect(() => {
    const card = cardRef.current;
    const wrap = wrapRef.current;

    if (!card || !wrap || !animationHandlers) return;

    const pointerMoveHandler = handlePointerMove as EventListener;
    const pointerEnterHandler = handlePointerEnter as EventListener;
    const pointerLeaveHandler = handlePointerLeave as EventListener;

    card.addEventListener("pointerenter", pointerEnterHandler);
    card.addEventListener("pointermove", pointerMoveHandler);
    card.addEventListener("pointerleave", pointerLeaveHandler);

    const initialX = wrap.clientWidth / 2;
    const initialY = wrap.clientHeight / 2;
    animationHandlers.updateCardTransform(initialX, initialY, card, wrap);
    animationHandlers.createSmoothAnimation(800, initialX, initialY, card, wrap);

    return () => {
      card.removeEventListener("pointerenter", pointerEnterHandler);
      card.removeEventListener("pointermove", pointerMoveHandler);
      card.removeEventListener("pointerleave", pointerLeaveHandler);
      animationHandlers.cancelAnimation();
    };
  }, [animationHandlers, handlePointerMove, handlePointerEnter, handlePointerLeave]);

  return (
    <section className="min-h-screen py-20 px-6" id="about">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-4">
            Meet The Artist
          </h2>
          <div className="w-80 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto rounded-full mb-8"></div>
          <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
            Meet <span className="font-semibold text-amber-400">{name}</span>, a visionary clay artist whose hands bring the extraordinary to life.
            With an innate ability to see beyond the conventional, she transforms humble clay into captivating sculptures that defy expectation.
            Her work is a testament to boundless creativity, showcasing a unique blend of whimsy, intricate detail, and truly innovative
            conceptualization that invites viewers into a world imagined only by her artistic vision.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 flex justify-center lg:justify-end">
            <div
              ref={wrapRef}
              className="relative w-full max-w-md"
              style={{
                perspective: "600px",
                touchAction: "none",
                "--card-radius": "24px"
              } as React.CSSProperties}
            >
              <div
                className="absolute inset-[-12px] rounded-3xl transition-all duration-500 ease-out opacity-60 blur-xl scale-95 bg-gradient-to-r from-amber-500/20 to-orange-500/20"
                style={{ transform: "translate3d(0,0,0.1px)" }}
              ></div>
              
              <div
                ref={cardRef}
                className="relative aspect-[3/4] h-[500px] rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm border border-slate-700 transition-transform duration-500 ease-out overflow-hidden shadow-2xl hover:shadow-amber-500/20"
                style={{
                  transform: "translate3d(0,0,0.1px) rotateX(var(--rotate-y, 0deg)) rotateY(var(--rotate-x, 0deg))",
                  boxShadow: "rgba(0,0,0,0.4) 0 8px 32px -8px, rgba(251,191,36,0.1) 0 0 60px -10px"
                }}
              >
                <div className="absolute inset-px bg-gradient-to-br from-slate-700/30 via-transparent to-amber-900/20 rounded-3xl">
                    <Image
                      className="absolute inset-0 object-cover filter brightness-90 contrast-110"
                      src={localAvatarImage}
                      alt={name + " - Clay Artist"}
                      fill
                      sizes="(max-width: 768px) 100vw, 500px"
                      priority
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                    
                    <div className="absolute top-6 left-6 right-6 z-20">
                      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">
                        {name}
                      </h3>
                      <p className="text-slate-300 text-sm font-medium">
                        {title}
                      </p>
                    </div>

                    {showUserInfo && (
                      <div className="absolute bottom-6 left-6 right-6 z-20 bg-slate-800/40 backdrop-blur-md border border-slate-600/30 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="text-sm font-semibold text-amber-400">
                                @{handle}
                              </div>
                              <div className="text-xs text-slate-400">
                                {status}
                              </div>
                            </div>
                          </div>
                          <button
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95"
                            onClick={onContactClick}
                            type="button"
                          >
                            {contactText}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-8">
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-4">Artistic Journey</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  With over a decade of experience in ceramic arts, I specialize in creating unique sculptural pieces
                  that blend traditional techniques with contemporary vision. Each piece tells a story, inviting viewers
                  to explore the boundaries between reality and imagination.
                </p>
                <p className="text-slate-300 text-lg leading-relaxed">
                  My work has been featured in galleries across the country, and I&#39;m passionate about sharing the
                  transformative power of clay through workshops and commissioned pieces.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-amber-400 mb-3">Specialties</h4>
                  <ul className="text-slate-300 space-y-2">
                    <li>• Sculptural ceramics</li>
                    <li>• Functional pottery</li>
                    <li>• Custom commissions</li>
                    <li>• Art installations</li>
                  </ul>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-amber-400 mb-3">Experience</h4>
                  <ul className="text-slate-300 space-y-2">
                    <li>• 12+ years in ceramics</li>
                    <li>• Gallery exhibitions</li>
                    <li>• Teaching & workshops</li>
                    <li>• Award-winning pieces</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={onContactClick}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold px-8 py-3 rounded-full transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95"
                >
                  Commission a Piece
                </button>
                <button className="border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 font-semibold px-8 py-3 rounded-full transition-all duration-200">
                  View Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
};

export default About;