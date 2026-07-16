import { useState } from "react";
import { heroProducts, type Product } from "../data/products";
import { useFitText } from "../hooks/useFitText";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useProductRing, type RingItemState } from "../hooks/useProductRing";
import { blendColorsCircular } from "../utils/color";

const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 1024;
const HEADLINE_TEXT = "Find your shade of nice.";

const ORIGINAL_HEADLINE = { left: 65, top: 130, width: 1293, height: 247 } as const;
const ORIGINAL_DESCRIPTION = { left: 75, top: 344, width: 537 } as const;
const ORIGINAL_RING_OFFSET = { x: 450, y: 70 } as const;

const RING_RADIUS_DESIGN = 380;
const RING_ITEM_SIZE_DESIGN = 420;

const HEADLINE_GRADIENT =
  "radial-gradient(ellipse 604.5px 125px at 50% 50%, rgb(255 255 255) 0%, rgb(255 255 255 / 0.4) 100%)";

const BACKGROUND_COLORS = heroProducts.map((product) => product.backgroundColor);

function scaleX(px: number): string {
  return `${(px / DESIGN_WIDTH) * 100}%`;
}

function scaleY(px: number): string {
  return `${(px / DESIGN_HEIGHT) * 100}%`;
}

function scaleOffset(px: number, axis: "x" | "y"): string {
  const base = axis === "x" ? "100vw" : "100vh";
  const design = axis === "x" ? DESIGN_WIDTH : DESIGN_HEIGHT;
  return `calc(${px} * ${base} / ${design})`;
}

function formatIngredients(product: Product): string {
  return product.ingredients.map((ingredient) => ingredient.name).join(", ");
}

type SliderBackgroundProps = {
  backgroundColor: string;
};

function SliderBackground({ backgroundColor }: SliderBackgroundProps) {
  return (
    <>
      <div
        className="ui-transition absolute inset-0"
        style={{ backgroundColor }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[127.8%] -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <img
          src="/figma/ellipse1.png"
          alt=""
          className="size-full object-cover"
        />
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-[6.25%] size-[62.2%] -translate-x-1/2 mix-blend-soft-light"
        aria-hidden="true"
      >
        <div className="absolute inset-[-43.53%]">
          <img
            src="/figma/ellipse2.png"
            alt=""
            className="size-full object-cover"
          />
        </div>
      </div>
    </>
  );
}

function BrandLogo() {
  return (
    <div
      className="pointer-events-none absolute bottom-[clamp(1.25rem,3.5vw,2.5rem)] left-[clamp(1.25rem,3.5vw,2.5rem)] z-50 max-md:bottom-4 max-md:left-4"
      aria-hidden="true"
    >
      <img
        src="/logo/nice-and-lovely.png"
        alt=""
        className="h-auto w-[clamp(5.5rem,9vw,8rem)] object-contain object-left max-md:w-[clamp(4.75rem,36vw,6.5rem)]"
      />
    </div>
  );
}

function SliderHeadline() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { containerRef, measureRef } = useFitText({
    text: HEADLINE_TEXT,
    maxFontSize: isDesktop ? 200 : 52,
    minFontSize: isDesktop ? 18 : 14,
    allowWrap: !isDesktop,
  });

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute z-20 max-md:relative max-md:w-full max-md:shrink-0"
      style={
        isDesktop
          ? {
              left: scaleX(ORIGINAL_HEADLINE.left),
              top: scaleY(ORIGINAL_HEADLINE.top),
              width: scaleX(ORIGINAL_HEADLINE.width),
              height: scaleY(ORIGINAL_HEADLINE.height),
            }
          : undefined
      }
      aria-hidden="true"
    >
      <span
        ref={measureRef}
        className="hero-headline invisible absolute left-0 top-0 max-w-full font-display capitalize leading-none tracking-display"
        aria-hidden="true"
      >
        {HEADLINE_TEXT}
      </span>
      <p className="hero-headline absolute inset-x-0 top-0 font-display capitalize leading-none tracking-display text-white">
        {HEADLINE_TEXT}
      </p>
      <p
        className="hero-headline absolute inset-x-0 top-0 font-display capitalize leading-none tracking-display mix-blend-overlay"
        style={{
          backgroundImage: HEADLINE_GRADIENT,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {HEADLINE_TEXT}
      </p>
    </div>
  );
}

type RingBottleImageProps = {
  src: string;
  fallbackColor: string;
  opacity: number;
};

function RingBottleImage({ src, opacity, fallbackColor }: RingBottleImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ backgroundColor: fallbackColor, opacity }}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 size-full object-contain"
      style={{ opacity }}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

type RingProductProps = {
  product: Product;
  item: RingItemState;
  itemSize: string;
  xOffset: string;
};

function RingProduct({ product, item, itemSize, xOffset }: RingProductProps) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 will-change-transform"
      style={{
        width: itemSize,
        height: itemSize,
        zIndex: item.zIndex,
        transform: `translate(calc(-50% + ${xOffset}), -50%) scale(${item.scale})`,
        opacity: item.opacity,
      }}
      aria-hidden="true"
    >
      <RingBottleImage
        src={product.bottleImage}
        fallbackColor={product.backgroundColor}
        opacity={1}
      />
    </div>
  );
}

type ProductRingProps = {
  ringItems: RingItemState[];
  radius: number;
};

function ProductRing({ ringItems, radius }: ProductRingProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const sortedItems = [...ringItems].sort((a, b) => a.zIndex - b.zIndex);

  const itemSize = isDesktop
    ? `calc(${RING_ITEM_SIZE_DESIGN} * 100vw / ${DESIGN_WIDTH})`
    : "min(42vw, 200px)";

  const ringOffsetStyle = isDesktop
    ? {
        transform: `translate(calc(-50% + ${scaleOffset(ORIGINAL_RING_OFFSET.x, "x")}), calc(-50% + ${scaleOffset(ORIGINAL_RING_OFFSET.y, "y")}))`,
      }
    : undefined;

  return (
    <div
      className="absolute left-1/2 top-1/2 z-0 max-md:relative max-md:left-auto max-md:top-auto max-md:mx-auto max-md:shrink-0 max-md:overflow-visible max-md:px-4 max-md:pt-16 max-md:pb-6"
      style={ringOffsetStyle}
      aria-hidden="true"
    >
      <div
        className="relative"
        style={
          isDesktop
            ? {
                width: `calc(${radius * 2} * 100vw / ${DESIGN_WIDTH})`,
                height: `calc(${RING_ITEM_SIZE_DESIGN * 1.35} * 100vw / ${DESIGN_WIDTH})`,
              }
            : {
                width: `min(${radius * 2}px, 92vw)`,
                height: "min(52vw, 260px)",
              }
        }
      >
        {sortedItems.map((item) => {
          const xOffset = isDesktop
            ? scaleOffset(item.x, "x")
            : `${item.x}px`;

          return (
            <RingProduct
              key={heroProducts[item.index].id}
              product={heroProducts[item.index]}
              item={item}
              itemSize={itemSize}
              xOffset={xOffset}
            />
          );
        })}
      </div>
    </div>
  );
}

type ProductCopyProps = {
  product: Product;
};

function ProductCopy({ product }: ProductCopyProps) {
  const stagger = (step: number) => ({ animationDelay: `${step * 75}ms` });

  return (
    <div className="flex gap-4 md:gap-5">
      <div
        className="info-panel-accent info-panel-enter"
        style={{ ...stagger(0), backgroundColor: product.accentColor }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <h2
          className="info-panel-title info-panel-enter mb-5 md:mb-6"
          style={stagger(1)}
        >
          {product.name}
        </h2>
        <p
          className="info-panel-purpose info-panel-enter mb-7 normal-case md:mb-8"
          style={stagger(2)}
        >
          {product.purpose}
        </p>
        <div className="info-panel-field info-panel-enter" style={stagger(3)}>
          <span
            className="info-panel-eyebrow"
            style={{ color: product.accentColor }}
          >
            Key Ingredients
          </span>
          <p className="info-panel-value m-0 normal-case">
            {formatIngredients(product)}
          </p>
        </div>
        <div className="info-panel-field info-panel-enter" style={stagger(4)}>
          <span
            className="info-panel-eyebrow"
            style={{ color: product.accentColor }}
          >
            Who Should Use It
          </span>
          <p className="info-panel-value m-0 normal-case">{product.whoShouldUse}</p>
        </div>
      </div>
    </div>
  );
}

type SliderDescriptionProps = {
  product: Product;
};

function SliderDescription({ product }: SliderDescriptionProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div
      className="pointer-events-none absolute z-10 w-full text-body max-md:relative max-md:z-auto max-md:w-auto max-md:px-0 max-md:pb-0 max-md:text-left"
      style={
        isDesktop
          ? {
              left: scaleX(ORIGINAL_DESCRIPTION.left),
              top: scaleY(ORIGINAL_DESCRIPTION.top),
              width: scaleX(ORIGINAL_DESCRIPTION.width),
              maxWidth: "42vw",
            }
          : undefined
      }
    >
      <ProductCopy key={product.id} product={product} />
    </div>
  );
}

export default function ProductSlider() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const ringRadius = isDesktop ? RING_RADIUS_DESIGN : 140;

  const {
    fractionalIndex,
    activeIndex,
    ringItems,
    containerRef,
  } = useProductRing({
    count: heroProducts.length,
    radius: ringRadius,
    minScale: 0.5,
    maxScale: 1.15,
    minOpacity: 0.3,
    maxOpacity: 1,
  });

  const activeProduct = heroProducts[activeIndex];
  const backgroundColor = blendColorsCircular(BACKGROUND_COLORS, fractionalIndex);

  return (
    <div className="relative h-dvh w-full overflow-hidden max-md:h-auto max-md:min-h-dvh max-md:overflow-x-hidden max-md:overflow-y-visible">
      <div
        ref={containerRef}
        className="relative size-full select-none border-0 outline-none max-md:h-auto max-md:min-h-dvh max-md:touch-pan-y md:touch-none"
      >
        <SliderBackground backgroundColor={backgroundColor} />
        <BrandLogo />

        <div className="relative z-10 flex flex-col items-stretch gap-6 px-6 pb-12 pt-8 max-md:flex md:contents">
          <SliderHeadline />
          <ProductRing ringItems={ringItems} radius={ringRadius} />
          <SliderDescription product={activeProduct} />
        </div>

        <p className="sr-only" aria-live="polite">
          {activeProduct.name}
        </p>
      </div>
    </div>
  );
}
