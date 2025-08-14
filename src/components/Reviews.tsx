"use client";
import { useRef, useEffect } from "react";
import {
  Renderer,
  Camera,
  Transform,
  Plane,
  Mesh,
  Program,
  Texture,
} from "ogl";

type GL = Renderer["gl"];

function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number) {
  let timeout: number;
  return function (this: unknown, ...args: Parameters<T>) {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t;
}

function createReviewTexture(
  gl: GL,
  review: ReviewData,
  cardWidth: number = 700,
  cardHeight: number = 450
): { texture: Texture; width: number; height: number } {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get 2d context");

  // High DPI support
  const dpr = window.devicePixelRatio || 1;
  canvas.width = cardWidth * dpr;
  canvas.height = cardHeight * dpr;
  canvas.style.width = cardWidth + 'px';
  canvas.style.height = cardHeight + 'px';
  context.scale(dpr, dpr);

  // Original background matching your About card
  const gradient = context.createLinearGradient(0, 0, cardWidth, cardHeight);
  gradient.addColorStop(0, '#1e293b'); // from-slate-800
  gradient.addColorStop(1, '#0f172a'); // to-slate-900
  context.fillStyle = gradient;
  
  // Create rounded rectangle background
  const radius = 24;
  context.beginPath();
  context.roundRect(0, 0, cardWidth, cardHeight, radius);
  context.fill();

  // Simple border matching About card
  context.strokeStyle = '#334155'; // border-slate-700
  context.lineWidth = 1;
  context.stroke();

  // Company name with enhanced styling
  const companyGradient = context.createLinearGradient(0, 0, cardWidth, 0);
  companyGradient.addColorStop(0, '#fbbf24'); // from-amber-400
  companyGradient.addColorStop(1, '#f97316'); // to-orange-500
  context.fillStyle = companyGradient;
  context.font = 'bold 42px system-ui, -apple-system, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Add subtle text shadow for depth
  context.shadowColor = 'rgba(0, 0, 0, 0.3)';
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;
  context.shadowBlur = 4;
  context.fillText(review.company, cardWidth / 2, 65);
  
  // Reset shadow
  context.shadowColor = 'transparent';
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 0;

  // Enhanced star rating with better positioning
  const starY = 125;
  const starSize = 32;
  const starSpacing = 38;
  const totalStarWidth = (5 * starSpacing) - 6;
  const startX = (cardWidth - totalStarWidth) / 2;
  
  context.font = `${starSize}px system-ui`;
  context.textAlign = 'center';
  
  for (let i = 0; i < 5; i++) {
    const x = startX + (i * starSpacing);
    if (i < review.rating) {
      // Filled star with gradient
      context.fillStyle = '#f59e0b'; // amber-500
      context.fillText('★', x, starY);
    } else {
      // Empty star
      context.fillStyle = '#64748b'; // slate-500
      context.fillText('☆', x, starY);
    }
  }

  // Quote icon for visual interest
  context.fillStyle = 'rgba(251, 191, 36, 0.2)'; // amber with transparency
  context.font = 'bold 48px Georgia, serif';
  context.textAlign = 'left';
  context.fillText('"', 30, 180);

  // Enhanced review text with better typography
  context.fillStyle = '#e2e8f0'; // text-slate-200 (slightly brighter)
  context.font = '32px system-ui, -apple-system, sans-serif';
  context.textAlign = 'left';
  context.textBaseline = 'top';
  
  const words = review.text.split(' ');
  const lines = [];
  let currentLine = '';
  const maxWidth = cardWidth - 100; // More padding
  const lineHeight = 38;
  const startY = 200;
  
  words.forEach(word => {
    const testLine = currentLine + word + ' ';
    const metrics = context.measureText(testLine);
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  });
  lines.push(currentLine.trim());

  // Limit to 4 lines to prevent overflow
  const maxLines = Math.min(lines.length, 4);
  
  lines.slice(0, maxLines).forEach((line, index) => {
    if (index === maxLines - 1 && lines.length > maxLines) {
      // Add ellipsis if text is truncated
      line = line.substring(0, line.lastIndexOf(' ')) + '...';
    }
    context.fillText(line, 50, startY + (index * lineHeight));
  });

  // Closing quote
  context.fillStyle = 'rgba(251, 191, 36, 0.2)';
  context.font = 'bold 48px Georgia, serif';
  context.textAlign = 'right';
  context.fillText('"', cardWidth - 30, startY + ((maxLines - 1) * lineHeight) + 20);

  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: cardWidth, height: cardHeight };
}

interface ReviewData {
  company: string;
  rating: number;
  text: string;
}

interface MediaProps {
  geometry: Plane;
  gl: GL;
  review: ReviewData;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: ScreenSize;
  viewport: Viewport;
  bend: number;
  borderRadius?: number;
}

interface ScreenSize {
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
}

class Media {
  extra: number = 0;
  geometry: Plane;
  gl: GL;
  review: ReviewData;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: ScreenSize;
  viewport: Viewport;
  bend: number;
  borderRadius: number;
  program!: Program;
  plane!: Mesh;
  scale!: number;
  padding!: number;
  width!: number;
  widthTotal!: number;
  x!: number;
  speed: number = 0;
  isBefore: boolean = false;
  isAfter: boolean = false;

  constructor({
    geometry,
    gl,
    review,
    index,
    length,
    renderer,
    scene,
    screen,
    viewport,
    bend,
    borderRadius = 0,
  }: MediaProps) {
    this.geometry = geometry;
    this.gl = gl;
    this.review = review;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.viewport = viewport;
    this.bend = bend;
    this.borderRadius = borderRadius;
    this.createShader();
    this.createMesh();
    this.onResize();
  }

  createShader() {
    const { texture } = createReviewTexture(this.gl, this.review);
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
            vUv = uv;
            vPosition = position;
            vec3 p = position;
            
            // Subtle wave animation that responds to scroll speed
            float wave = sin(p.x * 3.0 + uTime * 0.5) * cos(p.y * 2.0 + uTime * 0.3) * 0.02;
            p.z = wave * (0.5 + abs(uSpeed) * 2.0);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        varying vec3 vPosition;

        // Enhanced rounded rectangle function
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
            vec2 d = abs(p) - b + r;
            return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
        }

        void main() {
            vec2 uvOffset = vUv - 0.5;
            float cardDistance = roundedBoxSDF(uvOffset, vec2(0.48), uBorderRadius);
            
            // Main card content
            if (cardDistance < 0.0) {
                vec4 texColor = texture2D(tMap, vUv);
                
                // Subtle highlight effect
                float highlight = 1.0 + sin(uTime * 2.0 + vPosition.x * 5.0) * 0.01 * abs(uSpeed);
                
                gl_FragColor = vec4(texColor.rgb * highlight, texColor.a);
            } 
            // Improved shadow rendering
            else {
                // Simple, clean shadow
                float shadowDistance = cardDistance - 0.01;
                float shadowAlpha = 1.0 - smoothstep(0.0, 0.04, shadowDistance);
                
                // Clean black shadow like your About component
                gl_FragColor = vec4(0.0, 0.0, 0.0, shadowAlpha * 0.3);
            }
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
      },
      transparent: true,
    });
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    });
    this.plane.setParent(this.scene);
  }

  update(
    scroll: { current: number; last: number },
    direction: "right" | "left"
  ) {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = Math.min(Math.abs(this.speed), 2.0);

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === "right" && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === "left" && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }

  onResize({
    screen,
    viewport,
  }: { screen?: ScreenSize; viewport?: Viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) this.viewport = viewport;
    
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (800 * this.scale)) / this.screen.width;
    
    this.padding = 3; // Increased padding for better spacing
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

interface AppConfig {
  reviews?: ReviewData[];
  bend?: number;
  borderRadius?: number;
}

class App {
  container: HTMLElement;
  scroll: {
    ease: number;
    current: number;
    target: number;
    last: number;
    position?: number;
  };
  onCheckDebounce: (...args: unknown[]) => void;
  renderer!: Renderer;
  gl!: GL;
  camera!: Camera;
  scene!: Transform;
  planeGeometry!: Plane;
  medias: Media[] = [];
  reviewsData: ReviewData[] = [];
  screen!: { width: number; height: number };
  viewport!: { width: number; height: number };
  raf: number = 0;

  boundOnResize!: () => void;
  boundOnWheel!: (e: WheelEvent) => void;
  boundOnTouchDown!: (e: MouseEvent | TouchEvent) => void;
  boundOnTouchMove!: (e: MouseEvent | TouchEvent) => void;
  boundOnTouchUp!: () => void;

  isDown: boolean = false;
  start: number = 0;

  constructor(
    container: HTMLElement,
    {
      reviews,
      bend = 1.5,
      borderRadius = 0.04,
    }: AppConfig
  ) {
    this.container = container;
    this.scroll = { ease: 0.08, current: 0, target: 0, last: 0 }; // Smoother scrolling
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(reviews, bend, borderRadius);
    this.update();
    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({ 
      alpha: true,
      antialias: true, // Enable antialiasing for smoother edges
      powerPreference: 'high-performance'
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    
    // Enable blending for proper transparency
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    
    this.container.appendChild(this.renderer.gl.canvas as HTMLCanvasElement);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 80, // Increased for smoother deformation
      widthSegments: 120,
    });
  }

  createMedias(
    reviews: ReviewData[] | undefined,
    bend: number = 1.5,
    borderRadius: number
  ) {
    const defaultReviews: ReviewData[] = [
      {
        company: "Artisan Collective",
        rating: 5,
        text: "Elena's ceramic sculptures transformed our gallery space completely. Her unique artistic vision and exceptional craftsmanship create pieces that captivate every visitor. Truly extraordinary work that exceeds all expectations."
      },
      {
        company: "Modern Living Co.",
        rating: 5,
        text: "Working with Elena was an absolute pleasure. She created custom ceramic pieces that perfectly complement our interior design aesthetic. Her attention to detail and creative approach are simply unmatched."
      },
      {
        company: "Heritage Museum",
        rating: 4,
        text: "Elena's sculptural ceramics brought a fresh contemporary perspective to our traditional collection. Her innovative techniques and artistic vision create dialogue between past and present beautifully."
      },
      {
        company: "Boutique Hotels Group",
        rating: 5,
        text: "The ceramic installations Elena created for our properties are conversation starters. Guests are consistently amazed by the intricate details and unique forms. Professional service, artistic excellence."
      },
      {
        company: "Creative Interiors",
        rating: 4,
        text: "Elena's functional pottery pieces are works of art that our clients treasure. Each piece reflects her masterful understanding of form, texture, and glazing techniques. Highly recommended for discerning collectors."
      },
      {
        company: "Sculpture Society",
        rating: 5,
        text: "Elena's innovative approach to clay as a medium pushes artistic boundaries. Her sculptures demonstrate technical mastery while maintaining emotional depth. A truly gifted artist whose work speaks volumes."
      }
    ];
    
    const reviewsToUse = reviews && reviews.length ? reviews : defaultReviews;
    this.reviewsData = reviewsToUse.concat(reviewsToUse);
    this.medias = this.reviewsData.map((review, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        review,
        index,
        length: this.reviewsData.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        viewport: this.viewport,
        bend,
        borderRadius,
      });
    });
  }

  onTouchDown(e: MouseEvent | TouchEvent) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = "touches" in e ? e.touches[0].clientX : e.clientX;
  }

  onTouchMove(e: MouseEvent | TouchEvent) {
    if (!this.isDown) return;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * 0.04; // Slightly reduced sensitivity
    this.scroll.target = (this.scroll.position ?? 0) + distance;
  }

  onTouchUp() {
    this.isDown = false;
    this.onCheck();
  }

  onWheel(e: WheelEvent) {
    // Improved wheel handling with momentum
    const delta = e.deltaY > 0 ? 1.5 : -1.5;
    this.scroll.target += delta;
    this.onCheckDebounce();
  }

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height,
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) {
      this.medias.forEach((media) =>
        media.onResize({ screen: this.screen, viewport: this.viewport })
      );
    }
  }

  update() {
    this.scroll.current = lerp(
      this.scroll.current,
      this.scroll.target,
      this.scroll.ease
    );
    const direction = this.scroll.current > this.scroll.last ? "right" : "left";
    if (this.medias) {
      this.medias.forEach((media) => media.update(this.scroll, direction));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    
    window.addEventListener("resize", this.boundOnResize);
    window.addEventListener("wheel", this.boundOnWheel);
    window.addEventListener("mousedown", this.boundOnTouchDown);
    window.addEventListener("mousemove", this.boundOnTouchMove);
    window.addEventListener("mouseup", this.boundOnTouchUp);
    window.addEventListener("touchstart", this.boundOnTouchDown);
    window.addEventListener("touchmove", this.boundOnTouchMove);
    window.addEventListener("touchend", this.boundOnTouchUp);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.boundOnResize);
    window.removeEventListener("wheel", this.boundOnWheel);
    window.removeEventListener("mousedown", this.boundOnTouchDown);
    window.removeEventListener("mousemove", this.boundOnTouchMove);
    window.removeEventListener("mouseup", this.boundOnTouchUp);
    window.removeEventListener("touchstart", this.boundOnTouchDown);
    window.removeEventListener("touchmove", this.boundOnTouchMove);
    window.removeEventListener("touchend", this.boundOnTouchUp);
    if (
      this.renderer &&
      this.renderer.gl &&
      this.renderer.gl.canvas.parentNode
    ) {
      this.renderer.gl.canvas.parentNode.removeChild(
        this.renderer.gl.canvas as HTMLCanvasElement
      );
    }
  }
}

interface CustomerReviewsProps {
  reviews?: ReviewData[];
  bend?: number;
  borderRadius?: number;
}

export default function CustomerReviews({
  reviews,
  bend = 1.5,
  borderRadius = 0.04,
}: CustomerReviewsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const app = new App(containerRef.current, {
      reviews,
      bend,
      borderRadius,
    });
    return () => {
      app.destroy();
    };
  }, [reviews, bend, borderRadius]);

  return (
    <section className="min-h-screen py-20 px-6 overflow-hidden" id="reviews">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-4">
            Client Testimonials
          </h2>
          <div className="w-80 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto rounded-full mb-8"></div>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Discover what clients say about working with Elena and her extraordinary ceramic artistry. 
            Each review reflects our commitment to exceptional craftsmanship and creative excellence.
          </p>
        </div>
        
        <div className="mb-6 text-center">
          <p className="text-sm text-slate-400 font-medium">
            Drag to explore • Scroll to navigate
          </p>
        </div>
        
        <div
          className="w-full h-[550px] cursor-grab active:cursor-grabbing relative"
          ref={containerRef}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.03) 0%, transparent 70%)',
          }}
        />
        
        <div className="mt-12 text-center">
          <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold px-8 py-3 rounded-full transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95">
            Share Your Experience
          </button>
        </div>
      </div>
    </section>
  );
}