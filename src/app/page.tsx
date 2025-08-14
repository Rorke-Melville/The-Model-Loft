"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Showcase from "../components/Showcase";
import About from "../components/About";
import Reviews from "../components/Reviews";
import Footer from "../components/Footer";

export default function Home() {
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const spark = (e: MouseEvent) => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.innerHTML = `<path d="M12 2L15 8L22 9L17 14L18 21L12 17L6 21L7 14L2 9L9 8Z" fill="yellow"/>`;
      svg.style.position = "absolute";
      svg.style.width = "20px";
      svg.style.height = "20px";
      svg.style.left = `${e.clientX}px`;
      svg.style.top = `${e.clientY}px`;
      appRef.current!.appendChild(svg);
      gsap.to(svg, {
        x: "random(-50, 50)",
        y: "random(-50, 50)",
        opacity: 0,
        duration: 0.5,
        onComplete: () => svg.remove(),
      });
    };
    appRef.current!.addEventListener("click", spark);
    return () => appRef.current!.removeEventListener("click", spark);
  }, []);

  return (
    <div ref={appRef} className="min-h-screen text-white relative overflow-hidden">
      <Navbar />
      <Hero />
      <Showcase
             animateFrom="bottom"
             scaleOnHover={true}
             blurToFocus={true}
           />
      <About />
      <Reviews />
      <Footer />
    </div>
  );
}