type ProductDotsProps = {
  count: number;
  activeIndex: number;
  accentColor: string;
  onSelect: (index: number) => void;
  className?: string;
};

export default function ProductDots({
  count,
  activeIndex,
  accentColor,
  onSelect,
  className = "pointer-events-auto absolute inset-x-0 bottom-6 flex justify-center gap-dot-gap",
}: ProductDotsProps) {
  return (
    <nav
      data-carousel-dots
      className={className}
      aria-label="Browse products"
    >
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={index}
            type="button"
            aria-label={`Product ${index + 1} of ${count}`}
            aria-current={isActive ? "true" : undefined}
            onClick={() => onSelect(index)}
            className="ui-transition h-dot rounded-full"
            style={{
              width: isActive ? "var(--size-dot-active)" : "var(--size-dot)",
              backgroundColor: isActive ? accentColor : "var(--color-dot-idle)",
              opacity: isActive ? 1 : 0.45,
            }}
          />
        );
      })}
    </nav>
  );
}
