import gsap from "gsap";
import { blendColorsCircular, lerpHexColor } from "../utils/color";
import { Bokeh } from "./bokeh";

export type EngineTheme = { bg: string; ink: string };

type EngineOptions = {
  root: HTMLElement;
  items: HTMLElement[];
  headline: HTMLElement;
  halo: HTMLElement;
  keyword: HTMLElement;
  canvas: HTMLCanvasElement;
  themes: EngineTheme[];
  cover: EngineTheme;
  reducedMotion: boolean;
  onActiveChange: (index: number) => void;
  onModeChange: (mode: "cover" | "explore") => void;
  onInteract: () => void;
};

const DWELL_SECONDS = 5.2;
const COVER_DWELL_SECONDS = 5.5;
const IDLE_AFTER_INTERACTION_MS = 7000;
const ROTATE_DURATION = 1.15;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mod = (v: number, n: number) => ((v % n) + n) % n;

/**
 * Drives the whole showcase from a handful of numbers:
 *  - pos: fractional product index on the ring (i is front when pos === i)
 *  - m:   0 = cover fan, 1 = explore ring
 * Every frame it derives transforms, colours and depth from those values,
 * so GSAP only ever tweens scalars and React only re-renders on index change.
 */
export class ShowcaseEngine {
  private o: EngineOptions;
  private n: number;
  private state = { pos: 0, m: 0 };
  private intro: number[];
  private lift: number[];
  private hover = -1;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private dims = { W: 0, H: 0, size: 0, R: 0, mobile: false, headW: 0, headH: 0 };
  private active = 0;
  private mode: "cover" | "explore" = "cover";
  private posTween: gsap.core.Tween | null = null;
  private target = 0;
  private modeTween: gsap.core.Tween | null = null;
  private progress = 0;
  private idleUntil = 0;
  private coverIdleUntil = Infinity;
  private introDone = false;
  private drag = {
    id: -1,
    startX: 0,
    startY: 0,
    startPos: 0,
    axis: "none" as "none" | "x" | "y",
    lastX: 0,
    lastT: 0,
    vel: 0,
    moved: false,
  };
  private wheelAcc = 0;
  private wheelLockUntil = 0;
  private lastVars = { bg: "", ink: "", m: "", p: "" };
  private bokeh: Bokeh;
  private ro: ResizeObserver;
  private cleanups: Array<() => void> = [];

  constructor(options: EngineOptions) {
    this.o = options;
    this.n = options.items.length;
    this.intro = options.items.map(() => (options.reducedMotion ? 0 : 1));
    this.lift = options.items.map(() => 0);
    this.bokeh = new Bokeh(options.canvas, options.reducedMotion);

    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(options.root);
    this.measure();
    this.bind();
    gsap.ticker.add(this.tick);
  }

  destroy() {
    gsap.ticker.remove(this.tick);
    this.posTween?.kill();
    this.modeTween?.kill();
    this.ro.disconnect();
    this.cleanups.forEach((fn) => fn());
    gsap.killTweensOf(this.state);
    gsap.killTweensOf(this.intro);
  }

  /* ---------------------------------------------------------------- public */

  playIntro(timeline: gsap.core.Timeline, at: number) {
    if (this.o.reducedMotion) {
      this.introDone = true;
      return;
    }
    // bottles rise into the fan, centre-out
    const c = (this.n - 1) / 2;
    this.intro.forEach((_, i) => {
      const proxy = { v: 1 };
      timeline.to(
        proxy,
        {
          v: 0,
          duration: 1.4,
          ease: "expo.out",
          onUpdate: () => {
            this.intro[i] = proxy.v;
          },
        },
        at + Math.abs(i - c) * 0.09,
      );
    });
    timeline.call(() => {
      this.introDone = true;
      this.coverIdleUntil = performance.now() + COVER_DWELL_SECONDS * 1000;
    });
  }

  explore(index = this.active) {
    const cur = Math.round(this.state.pos);
    this.state.pos = cur + this.shortest(cur, index);
    this.setActive(index);
    this.setMode("explore");
    this.progress = 0;
    this.modeTween?.kill();
    this.modeTween = gsap.to(this.state, {
      m: 1,
      duration: this.o.reducedMotion ? 0.01 : 1.6,
      ease: "power3.inOut",
    });
  }

  toCover() {
    this.setMode("cover");
    this.coverIdleUntil = performance.now() + COVER_DWELL_SECONDS * 2000;
    this.modeTween?.kill();
    this.modeTween = gsap.to(this.state, {
      m: 0,
      duration: this.o.reducedMotion ? 0.01 : 1.2,
      ease: "power3.inOut",
    });
  }

  goTo(index: number, user = true) {
    if (user) this.markInteraction();
    if (this.mode === "cover") {
      this.explore(index);
      return;
    }
    const cur = this.base();
    this.animatePos(cur + this.shortest(cur, index), ROTATE_DURATION);
  }

  next(user = true) {
    if (user) this.markInteraction();
    if (this.mode === "cover") return this.explore(this.active);
    this.animatePos(this.base() + 1, ROTATE_DURATION);
  }

  prev(user = true) {
    if (user) this.markInteraction();
    if (this.mode === "cover") return this.explore(this.active);
    this.animatePos(this.base() - 1, ROTATE_DURATION);
  }

  setHover(index: number) {
    this.hover = index;
  }

  /* --------------------------------------------------------------- private */

  private markInteraction() {
    this.idleUntil = performance.now() + IDLE_AFTER_INTERACTION_MS;
    this.progress = 0;
    this.o.onInteract();
  }

  /** Where the ring is heading: queued clicks stack instead of re-aiming at the same slot. */
  private base() {
    return this.posTween ? this.target : Math.round(this.state.pos);
  }

  private shortest(from: number, to: number) {
    let d = mod(to - from, this.n);
    if (d > this.n / 2) d -= this.n;
    return d;
  }

  private animatePos(target: number, duration: number, ease = "power3.inOut") {
    this.posTween?.kill();
    this.progress = 0;
    this.target = target;
    this.posTween = gsap.to(this.state, {
      pos: target,
      duration: this.o.reducedMotion ? 0.01 : duration,
      ease,
      onComplete: () => {
        this.posTween = null;
      },
    });
  }

  private setActive(index: number) {
    if (index === this.active) return;
    this.active = index;
    this.o.onActiveChange(index);
  }

  private setMode(mode: "cover" | "explore") {
    if (mode === this.mode) return;
    this.mode = mode;
    this.o.onModeChange(mode);
  }

  measure() {
    const { root, items, headline } = this.o;
    const W = root.clientWidth;
    const H = root.clientHeight;
    const mobile = W < 768;
    const size = mobile ? Math.min(W * 0.74, H * 0.36) : Math.min(H * 0.64, W * 0.36);
    const R = mobile ? W * 0.34 : Math.min(W * 0.2, size * 0.62);
    items.forEach((el) => {
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
    });
    const font = mobile ? Math.min(W * 0.2, 96) : Math.min(W * 0.112, H * 0.19);
    headline.style.fontSize = `${font}px`;
    // phones: let the script title wrap onto two centred lines
    headline.style.width = mobile ? `${W - 32}px` : "";
    this.dims = {
      W,
      H,
      size,
      R,
      mobile,
      headW: headline.offsetWidth,
      headH: headline.offsetHeight,
    };
    this.bokeh.resize(W, H);
  }

  private bind() {
    const root = this.o.root;

    const onPointerMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      this.pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      this.pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      this.onDragMove(e);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button, a, [data-no-drag]")) return;
      const d = this.drag;
      d.id = e.pointerId;
      d.startX = d.lastX = e.clientX;
      d.startY = e.clientY;
      d.startPos = this.state.pos;
      d.axis = "none";
      d.lastT = performance.now();
      d.vel = 0;
      d.moved = false;
    };
    const onPointerUp = (e: PointerEvent) => {
      const d = this.drag;
      if (d.id !== e.pointerId) return;
      d.id = -1;
      if (d.axis === "x") {
        root.releasePointerCapture?.(e.pointerId);
        root.classList.remove("is-dragging");
        // momentum: project forward and settle on the nearest product
        const projected = this.state.pos + d.vel * 0.28;
        const target = Math.round(projected);
        this.animatePos(target, 0.85, "power3.out");
      }
      d.axis = "none";
    };
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const now = performance.now();
      if (this.mode === "cover") {
        if (delta > 20 && this.introDone) {
          this.markInteraction();
          this.explore(this.active);
          this.wheelLockUntil = now + 1200;
        }
        return;
      }
      if (now < this.wheelLockUntil) return;
      this.wheelAcc += delta;
      if (Math.abs(this.wheelAcc) > 45) {
        if (this.wheelAcc > 0) this.next();
        else this.prev();
        this.wheelAcc = 0;
        this.wheelLockUntil = now + 750;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        this.next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.prev();
      } else if (e.key === "Escape" && this.mode === "explore") {
        this.markInteraction();
        this.toCover();
      } else if ((e.key === "Enter" || e.key === " ") && this.mode === "cover") {
        if ((e.target as HTMLElement).closest("button")) return;
        e.preventDefault();
        this.markInteraction();
        this.explore(this.active);
      }
    };
    const onVisibility = () => {
      if (!document.hidden) this.progress = Math.min(this.progress, 0.6);
    };

    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointerup", onPointerUp);
    root.addEventListener("pointercancel", onPointerUp);
    root.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    this.cleanups.push(() => {
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerUp);
      root.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
    });
  }

  private onDragMove(e: PointerEvent) {
    const d = this.drag;
    if (d.id !== e.pointerId || this.mode !== "explore") return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.axis === "none") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (d.axis === "x") {
        this.posTween?.kill();
        d.startPos = this.state.pos;
        this.o.root.setPointerCapture?.(e.pointerId);
        this.o.root.classList.add("is-dragging");
        this.markInteraction();
      }
      return;
    }
    if (d.axis !== "x") return;
    d.moved = true;
    const step = (Math.PI * 2) / this.n;
    const unit = this.dims.R * step;
    this.state.pos = d.startPos - (e.clientX - d.startX) / unit;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT) / 1000;
    const instVel = -(e.clientX - d.lastX) / unit / dt;
    d.vel = lerp(d.vel, instVel, 0.35);
    d.lastX = e.clientX;
    d.lastT = now;
  }

  /** True when a click on a bottle should be treated as a click (not end of a drag). */
  wasDrag() {
    return this.drag.moved;
  }

  private tick = (_time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs, 64) / 1000;
    const now = performance.now();
    const { pos, m } = this.state;
    const { W, H, size, R, mobile, headW, headH } = this.dims;
    const n = this.n;
    const step = (Math.PI * 2) / n;

    // --- autoplay -------------------------------------------------------
    const userIdle = now > this.idleUntil;
    if (!this.o.reducedMotion && !document.hidden && this.introDone) {
      if (this.mode === "explore" && m > 0.98 && userIdle && this.drag.axis !== "x" && !this.posTween) {
        this.progress += dt / DWELL_SECONDS;
        if (this.progress >= 1) {
          this.progress = 0;
          this.next(false);
        }
      } else if (this.mode === "cover" && userIdle && this.hover === -1 && now > this.coverIdleUntil) {
        this.explore(this.active);
      }
    }

    // --- active index -----------------------------------------------------
    const activeNow = mod(Math.round(pos), n);
    if (this.mode === "explore" || m > 0.5) this.setActive(activeNow);

    // --- smoothed pointer -------------------------------------------------
    const p = this.pointer;
    const k = 1 - Math.pow(0.0025, dt);
    p.x = lerp(p.x, this.o.reducedMotion ? 0 : p.tx, k);
    p.y = lerp(p.y, this.o.reducedMotion ? 0 : p.ty, k);

    // --- layout anchors ----------------------------------------------------
    const coverCx = W * 0.5;
    const coverCy = mobile ? H * 0.56 : H * 0.6;
    const expCx = mobile ? W * 0.5 : W * 0.635;
    const expCy = mobile ? H * 0.335 : H * 0.55;
    const cx = lerp(coverCx, expCx, m);
    const cy = lerp(coverCy, expCy, m);
    const c = (n - 1) / 2;

    // --- items --------------------------------------------------------------
    this.o.items.forEach((el, i) => {
      // ring pose
      const theta = (i - pos) * step;
      const front = (Math.cos(theta) + 1) / 2; // 1 = front, 0 = back
      // simple perspective: far items pull toward the centre and rise
      const persp = 1 / (1 + (1 - Math.cos(theta)) * 0.55);
      const rx = R * Math.sin(theta) * 1.34 * persp;
      const ry = -(1 - front) * size * 0.26;
      const rs = 0.4 + 0.6 * Math.pow(front, 1.5);
      const ro = 0.3 + 0.7 * front;
      const rb = (1 - front) * 6.5;
      const rbr = 0.72 + 0.28 * front;

      // cover fan pose
      const kk = i - c;
      this.lift[i] = lerp(this.lift[i], this.hover === i && this.mode === "cover" ? 1 : 0, 1 - Math.pow(0.0005, dt));
      const lift = this.lift[i];
      const gx = kk * size * (mobile ? 0.19 : 0.27);
      const gy = kk * kk * size * 0.009 - lift * size * 0.06;
      const gs = (mobile ? 0.88 : 0.74) + lift * 0.05;
      const gr = kk * 3.4 * (1 - lift * 0.6);

      const depth = lerp(0.6, 0.35 + front, m);
      const px = p.x * 16 * depth;
      const py = p.y * 9 * depth;

      const introOff = this.intro[i];
      const x = cx + lerp(gx, rx, m) + px;
      const y = cy + lerp(gy, ry, m) + py + introOff * H * 0.75;
      const s = lerp(gs, rs, m);
      const r = lerp(gr, 0, m) + introOff * kk * 6;
      const op = lerp(1, ro, m) * (1 - introOff * 0.9);
      const blur = rb * m;
      const br = lerp(1, rbr, m);

      el.style.transform = `translate3d(${(x - size / 2).toFixed(1)}px, ${(y - size / 2).toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      el.style.opacity = op.toFixed(3);
      el.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px) brightness(${br.toFixed(3)})` : `brightness(${br.toFixed(3)})`;
      el.style.zIndex = String(Math.round(lerp(100 - Math.abs(kk) * 10 + lift * 50, front * 1000, m)));
      el.dataset.front = m > 0.5 && i === activeNow ? "true" : "false";
    });

    // --- halo + keyword follow the front slot --------------------------------
    const halo = this.o.halo;
    halo.style.transform = `translate3d(${(expCx + p.x * 10 - size * 0.7).toFixed(1)}px, ${(expCy - size * 0.75 + p.y * 6).toFixed(1)}px, 0)`;
    halo.style.width = halo.style.height = `${size * 1.4}px`;
    halo.style.opacity = (m * 0.95).toFixed(3);

    const kw = this.o.keyword;
    kw.style.transform = `translate3d(${(expCx - p.x * 26).toFixed(1)}px, ${(expCy - size * 0.08 - p.y * 14).toFixed(1)}px, 0) translate(-50%, -50%)`;
    kw.style.opacity = m.toFixed(3);

    // --- headline: centred cover title → compact script eyebrow -------------
    const head = this.o.headline;
    const coverX = (W - headW) / 2;
    const coverY = mobile ? H * 0.12 : H * 0.115;
    const exScale = mobile ? 0.42 : 0.34;
    const exX = mobile ? (W - headW * exScale) / 2 : W * 0.06;
    const exY = mobile ? H * 0.105 : H * 0.15;
    const hs = lerp(1, exScale, m);
    head.style.transform = `translate3d(${lerp(coverX, exX, m).toFixed(1)}px, ${(lerp(coverY, exY, m) - p.y * 4 * (1 - m)).toFixed(1)}px, 0) scale(${hs.toFixed(4)})`;
    head.style.opacity = mobile ? Math.max(0, 1 - m * 1.6).toFixed(3) : "1";
    void headH;

    // --- theme colours ----------------------------------------------------
    const bgs = this.o.themes.map((t) => t.bg);
    const inks = this.o.themes.map((t) => t.ink);
    const bg = lerpHexColor(this.o.cover.bg, blendColorsCircular(bgs, pos), m);
    const ink = lerpHexColor(this.o.cover.ink, blendColorsCircular(inks, pos), m);
    const style = this.o.root.style;
    const lv = this.lastVars;
    if (bg !== lv.bg) style.setProperty("--bg", (lv.bg = bg));
    if (ink !== lv.ink) style.setProperty("--ink", (lv.ink = ink));
    const mStr = m.toFixed(3);
    if (mStr !== lv.m) style.setProperty("--m", (lv.m = mStr));
    const pStr = this.progress.toFixed(4);
    if (pStr !== lv.p) style.setProperty("--progress", (lv.p = pStr));

    this.bokeh.draw(dt, p.x, p.y, m);
  };
}
