import { useLayoutEffect, useRef } from "react";

type UseFitTextOptions = {
  text: string;
  maxFontSize?: number;
  minFontSize?: number;
  allowWrap?: boolean;
};

export function useFitText({
  text,
  maxFontSize = 200,
  minFontSize = 20,
  allowWrap = false,
}: UseFitTextOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const fit = () => {
      measure.style.whiteSpace = "nowrap";
      let size = maxFontSize;
      measure.style.fontSize = `${size}px`;
      while (measure.scrollWidth > container.clientWidth && size > minFontSize) {
        size -= 1;
        measure.style.fontSize = `${size}px`;
      }

      const needsWrap =
        allowWrap && size <= minFontSize && measure.scrollWidth > container.clientWidth;
      container.dataset.headlineWrap = needsWrap ? "true" : "false";
      measure.style.whiteSpace = needsWrap ? "normal" : "nowrap";
      container.style.setProperty("--headline-font-size", `${size}px`);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text, maxFontSize, minFontSize, allowWrap]);

  return { containerRef, measureRef };
}
