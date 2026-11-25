import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { splitBenefit, type CampaignMeta, type Product } from "../data/products";

type Props = {
  product: Product;
  meta: CampaignMeta;
  index: number;
  total: number;
  hidden: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function ProductPanel({ product, meta, index, total, hidden }: Props) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const q = gsap.utils.selector(el);
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(q(".panel-name-line"), { yPercent: 105 }, { yPercent: 0, duration: 1, stagger: 0.06 })
      .fromTo(
        q("[data-reveal]"),
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.055, ease: "power3.out" },
        0.08,
      )
      .fromTo(q(".panel-rule"), { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power3.inOut" }, 0);
    return () => {
      tl.kill();
    };
  }, [product.id]);

  const benefits = product.bullets.map((b) => splitBenefit(b.text));
  const nameWords = product.name.replace(/ Lotion$/, "");

  return (
    <article ref={ref} className="panel" aria-hidden={hidden} data-no-drag>
      <p className="panel-eyebrow" data-reveal>
        <span className="panel-index">
          {pad(index + 1)} <span className="panel-total">/ {pad(total)}</span>
        </span>
        <span className="panel-dot" aria-hidden="true" />
        Your shade: <strong>{meta.shade}</strong>
      </p>

      <h2 className="panel-name">
        <span className="panel-name-mask">
          <span className="panel-name-line">{nameWords}</span>
        </span>
        <span className="panel-name-mask">
          <span className="panel-name-line panel-name-sub">Body Lotion</span>
        </span>
      </h2>

      <span className="panel-rule" aria-hidden="true" />

      <p className="panel-purpose" data-reveal>
        {product.purpose.charAt(0).toUpperCase() + product.purpose.slice(1)}.
      </p>

      <ul className="panel-benefits">
        {benefits.map((b) => (
          <li key={b.title} data-reveal title={b.detail || undefined}>
            <span className="benefit-mark" aria-hidden="true" />
            <span>
              <strong>{b.title}</strong>
              {b.detail && <span className="benefit-detail">{b.detail}</span>}
            </span>
          </li>
        ))}
      </ul>

      <dl className="panel-meta">
        <div data-reveal>
          <dt>Key ingredient</dt>
          <dd>{product.ingredients.map((i) => i.name).join(", ")}</dd>
        </div>
        <div data-reveal>
          <dt>Sizes</dt>
          <dd className="chips">
            {product.sizes.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </dd>
        </div>
        <div data-reveal className="panel-meta-wide">
          <dt>Made for</dt>
          <dd>{product.whoShouldUse}</dd>
        </div>
      </dl>
    </article>
  );
}
