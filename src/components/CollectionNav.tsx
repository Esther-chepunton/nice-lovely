import { campaign, heroProducts } from "../data/products";

type Props = {
  active: number;
  hidden: boolean;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function CollectionNav({ active, hidden, onSelect, onPrev, onNext }: Props) {
  const tab = hidden ? -1 : 0;
  return (
    <nav className="collection-nav" aria-label="Choose a lotion" aria-hidden={hidden} data-no-drag>
      <button type="button" className="nav-arrow" onClick={onPrev} tabIndex={tab} aria-label="Previous lotion">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>

      <ol className="nav-list">
        {heroProducts.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              className="nav-item"
              aria-current={i === active ? "true" : undefined}
              tabIndex={tab}
              onClick={() => onSelect(i)}
            >
              <span className="nav-swatch" style={{ backgroundColor: p.backgroundColor }} aria-hidden="true" />
              <span className="nav-label">{campaign[p.id].short}</span>
              <span className="nav-track" aria-hidden="true">
                <span className="nav-fill" />
              </span>
            </button>
          </li>
        ))}
      </ol>

      <button type="button" className="nav-arrow" onClick={onNext} tabIndex={tab} aria-label="Next lotion">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <p className="nav-hint" aria-hidden="true">
        Drag, scroll or use ← → to explore
      </p>
    </nav>
  );
}
