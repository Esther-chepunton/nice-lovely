type Orb = {
  x: number;
  y: number;
  r: number;
  depth: number;
  speed: number;
  phase: number;
  alpha: number;
};

/** Soft, drifting light orbs — a quiet "lotion shimmer" layer behind the bottles. */
export class Bokeh {
  private ctx: CanvasRenderingContext2D | null;
  private orbs: Orb[] = [];
  private W = 0;
  private H = 0;
  private dpr = 1;
  private t = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private still: boolean,
  ) {
    this.ctx = canvas.getContext("2d");
  }

  resize(W: number, H: number) {
    this.W = W;
    this.H = H;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(W * this.dpr);
    this.canvas.height = Math.round(H * this.dpr);
    const count = W < 768 ? 16 : 30;
    this.orbs = Array.from({ length: count }, () => this.spawn(true));
  }

  private spawn(anywhere: boolean): Orb {
    const depth = Math.random();
    return {
      x: Math.random() * this.W,
      y: anywhere ? Math.random() * this.H : this.H + 80,
      r: 6 + Math.pow(Math.random(), 2.2) * 70 * (0.4 + depth),
      depth,
      speed: 6 + depth * 18,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.05 + Math.random() * 0.16,
    };
  }

  draw(dt: number, px: number, py: number, m: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    this.t += dt;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    const strength = 0.35 + 0.65 * m;

    for (let i = 0; i < this.orbs.length; i += 1) {
      const o = this.orbs[i];
      if (!this.still) {
        o.y -= o.speed * dt;
        if (o.y < -o.r * 2) this.orbs[i] = this.spawn(false);
      }
      const sway = Math.sin(this.t * 0.4 + o.phase) * 14 * o.depth;
      const x = o.x + sway - px * 30 * o.depth;
      const y = o.y - py * 18 * o.depth;
      const g = ctx.createRadialGradient(x, y, 0, x, y, o.r);
      const a = o.alpha * strength;
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(0.6, `rgba(255,255,255,${a * 0.45})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
