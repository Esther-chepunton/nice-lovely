import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { COVER_THEME, campaign, heroProducts } from "../data/products";
import { ShowcaseEngine } from "../engine/showcaseEngine";
import { useMediaQuery } from "../hooks/useMediaQuery";
import ProductPanel from "./ProductPanel";
import CollectionNav from "./CollectionNav";

const HEADLINE = "Find your shade of nice.";

function preload(srcs: string[]) {
  const images = srcs.map(
    (src) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => resolve();
        img.src = src;
      }),
  );
  const fonts = (document.fonts?.ready ?? Promise.resolve()).then(() => undefined);
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3500));
  return Promise.race([Promise.all([...images, fonts]), timeout]);
}

export default function Showcase() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<"cover" | "explore">("cover");
  const [touched, setTouched] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const keywordRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<HTMLDivElement[]>([]);
  const engineRef = useRef<ShowcaseEngine | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const engine = new ShowcaseEngine({
      root,
      items: itemRefs.current,
      headline: headlineRef.current!,
      halo: haloRef.current!,
      keyword: keywordRef.current!,
      canvas: canvasRef.current!,
      themes: heroProducts.map((p) => ({ bg: p.backgroundColor, ink: campaign[p.id].ink })),
      cover: COVER_THEME,
      reducedMotion,
      onActiveChange: setActive,
      onModeChange: setMode,
      onInteract: () => setTouched(true),
    });
    engineRef.current = engine;

    let cancelled = false;
    let tl: gsap.core.Timeline | null = null;
    const q = gsap.utils.selector(root);

    gsap.set(q("[data-intro]"), { autoAlpha: 0, y: reducedMotion ? 0 : 24 });
    gsap.set(q(".headline-ink"), { clipPath: "inset(-30% 105% -30% -8%)" });

    preload([...heroProducts.map((p) => p.bottleImage), "/logo/nice-and-lovely-crop.png"]).then(() => {
      if (cancelled) return;
      engine.measure();
      tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (reducedMotion) {
        tl.set(q(".headline-ink"), { clipPath: "inset(-30% -8% -30% -8%)" })
          .set(q("[data-intro]"), { autoAlpha: 1, y: 0 })
          .to(loaderRef.current, { autoAlpha: 0, duration: 0.2 });
        engine.playIntro(tl, 0);
        return;
      }
      tl.to(q(".loader-mark"), { scale: 0.92, autoAlpha: 0, duration: 0.5, ease: "power2.in" })
        .to(loaderRef.current, { autoAlpha: 0, duration: 0.6 }, "-=0.1")
        .to(q("[data-intro='header']"), { autoAlpha: 1, y: 0, duration: 0.9 }, "-=0.3")
        .to(
          q(".headline-ink"),
          { clipPath: "inset(-30% -8% -30% -8%)", duration: 1.9, ease: "power2.inOut" },
          "<",
        );
      engine.playIntro(tl, 0.9);
      tl.to(q("[data-intro='cover']"), { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12 }, 1.8);
    });

    return () => {
      cancelled = true;
      tl?.kill();
      engine.destroy();
      engineRef.current = null;
    };
  }, [reducedMotion]);

  // keyword swap
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const el = keywordRef.current?.firstElementChild;
    if (!el) return;
    gsap.fromTo(
      el,
      { yPercent: 18, autoAlpha: 0, letterSpacing: "0.12em" },
      { yPercent: 0, autoAlpha: 1, letterSpacing: "-0.02em", duration: 1.1, ease: "expo.out" },
    );
  }, [active, reducedMotion]);

  useEffect(() => {
    document.title = `${heroProducts[active].name} · Find Your Shade Of Nice | Nice & Lovely`;
  }, [active]);

  const product = heroProducts[active];
  const meta = campaign[product.id];

  const onBottleClick = (index: number) => {
    const engine = engineRef.current;
    if (!engine || engine.wasDrag()) return;
    engine.goTo(index);
  };

  return (
    <div
      ref={rootRef}
      className="showcase"
      data-mode={mode}
      data-touched={touched ? "true" : "false"}
      aria-roledescription="carousel"
      aria-label="Nice & Lovely lotion collection"
    >
      <canvas ref={canvasRef} className="bokeh" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div ref={haloRef} className="halo" aria-hidden="true" />
      <div ref={keywordRef} className="keyword" aria-hidden="true">
        <span key={meta.keyword}>{meta.keyword}</span>
      </div>

      <header className="topbar" data-intro="header">
        <div className="logo-pill">
          <img src="/logo/nice-and-lovely-crop.png" alt="Nice & Lovely" />
        </div>
        <p className="topbar-label">The 48H Nourishing Collection</p>
        <button
          type="button"
          className="topbar-back"
          onClick={() => engineRef.current?.toCover()}
          tabIndex={mode === "explore" ? 0 : -1}
          aria-hidden={mode !== "explore"}
        >
          <span aria-hidden="true">←</span> All shades
        </button>
      </header>

      <h1 ref={headlineRef} className="headline">
        <span className="headline-ink">{HEADLINE}</span>
      </h1>

      <div className="stage" aria-hidden="true">
        {heroProducts.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => {
              if (el) itemRefs.current[i] = el;
            }}
            className="bottle"
          >
            <span className="bottle-shadow" />
            <img src={p.bottleImage} alt="" draggable={false} />
            <div
              className="bottle-hit"
              onClick={() => onBottleClick(i)}
              onPointerEnter={() => engineRef.current?.setHover(i)}
              onPointerLeave={() => engineRef.current?.setHover(-1)}
            />
          </div>
        ))}
      </div>

      <section className="cover-copy" aria-hidden={mode !== "cover"}>
        <p data-intro="cover" className="cover-sub">
          Six formulas. Forty-eight hours of nourishment.
          <br />
          One for every skin story.
        </p>
        <button
          data-intro="cover"
          type="button"
          className="cta"
          tabIndex={mode === "cover" ? 0 : -1}
          onClick={() => engineRef.current?.explore(0)}
        >
          Discover your shade
          <span aria-hidden="true" className="cta-arrow">
            →
          </span>
        </button>
      </section>

      <ProductPanel product={product} meta={meta} index={active} total={heroProducts.length} hidden={mode !== "explore"} />

      <CollectionNav
        active={active}
        hidden={mode !== "explore"}
        onSelect={(i) => engineRef.current?.goTo(i)}
        onPrev={() => engineRef.current?.prev()}
        onNext={() => engineRef.current?.next()}
      />

      <p className="sr-only" aria-live="polite">
        {mode === "explore" ? `${product.name}: ${product.purpose}` : ""}
      </p>

      <div ref={loaderRef} className="loader" aria-hidden="true">
        <img className="loader-mark" src="/logo/nice-and-lovely-crop.png" alt="" />
      </div>
    </div>
  );
}
