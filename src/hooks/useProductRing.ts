import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const AUTO_ROTATE_DEG_PER_FRAME = 0.018;
const IDLE_RESUME_MS = 2500;
const DRAG_PIXELS_PER_DEGREE = 2.5;
const KEYBOARD_NUDGE_DEGREES = 18;

export type RingItemState = {
  index: number;
  x: number;
  z: number;
  scale: number;
  opacity: number;
  zIndex: number;
};

type UseProductRingOptions = {
  count: number;
  radius: number;
  minScale?: number;
  maxScale?: number;
  minOpacity?: number;
  maxOpacity?: number;
  onActiveIndexChange?: (index: number) => void;
};

type UseProductRingResult = {
  rotationOffset: number;
  fractionalIndex: number;
  activeIndex: number;
  ringItems: RingItemState[];
  isDragging: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
};

function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

function normalizeAngleDegrees(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

function distanceFromFront(angle: number): number {
  const normalized = normalizeAngleDegrees(angle);
  return Math.min(normalized, 360 - normalized);
}

export function getFractionalIndex(rotationOffset: number, count: number): number {
  const angleStep = 360 / count;
  // As rotationOffset increases, the previous ring item (n-1) moves to front — not the next.
  return -rotationOffset / angleStep;
}

export function getActiveIndex(rotationOffset: number, count: number): number {
  const angleStep = 360 / count;
  let bestIndex = 0;
  let bestDistance = Infinity;

  for (let index = 0; index < count; index += 1) {
    const distance = distanceFromFront(index * angleStep + rotationOffset);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

/** Single source of truth: front-most product index and blend position for colour/text. */
export function getRingActiveState(rotationOffset: number, count: number): {
  fractionalIndex: number;
  activeIndex: number;
} {
  const fractionalIndex = getFractionalIndex(rotationOffset, count);
  const activeIndex = getActiveIndex(rotationOffset, count);
  return { fractionalIndex, activeIndex };
}

export function computeRingItems(
  count: number,
  rotationOffset: number,
  radius: number,
  minScale: number,
  maxScale: number,
  minOpacity: number,
  maxOpacity: number,
): RingItemState[] {
  const angleStep = 360 / count;

  return Array.from({ length: count }, (_, index) => {
    const effectiveAngleRad = ((index * angleStep + rotationOffset) * Math.PI) / 180;
    const x = radius * Math.sin(effectiveAngleRad);
    const z = radius * Math.cos(effectiveAngleRad);
    const scale = mapRange(z, -radius, radius, minScale, maxScale);
    const opacity = mapRange(z, -radius, radius, minOpacity, maxOpacity);

    return {
      index,
      x,
      z,
      scale,
      opacity,
      zIndex: Math.round(z * 100),
    };
  });
}

export function useProductRing({
  count,
  radius,
  minScale = 0.5,
  maxScale = 1.15,
  minOpacity = 0.3,
  maxOpacity = 1,
  onActiveIndexChange,
}: UseProductRingOptions): UseProductRingResult {
  const [rotationOffset, setRotationOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const isDraggingRef = useRef(false);
  const autoRotateRef = useRef(true);
  const lastInteractionRef = useRef(0);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartRotationRef = useRef(0);
  const dragAxisRef = useRef<"undecided" | "horizontal" | "vertical">("undecided");
  const activePointerIdRef = useRef<number | null>(null);
  const lastActiveIndexRef = useRef(0);
  const onActiveIndexChangeRef = useRef(onActiveIndexChange);
  const frameIdRef = useRef(0);
  const isLoopRunningRef = useRef(false);

  onActiveIndexChangeRef.current = onActiveIndexChange;

  const syncRotation = useCallback((value: number) => {
    rotationRef.current = value;
    setRotationOffset(value);

    const activeIndex = getActiveIndex(value, count);
    if (activeIndex !== lastActiveIndexRef.current) {
      lastActiveIndexRef.current = activeIndex;
      onActiveIndexChangeRef.current?.(activeIndex);
    }
  }, [count]);

  const pauseAutoRotate = useCallback(() => {
    autoRotateRef.current = false;
    lastInteractionRef.current = performance.now();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || count <= 1) return;

    function stopLoop(): void {
      if (frameIdRef.current !== 0) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = 0;
      }
      isLoopRunningRef.current = false;
    }

    function tick(now: number): void {
      if (
        !isDraggingRef.current &&
        !autoRotateRef.current &&
        now - lastInteractionRef.current >= IDLE_RESUME_MS
      ) {
        autoRotateRef.current = true;
      }

      if (!isDraggingRef.current && autoRotateRef.current) {
        syncRotation(rotationRef.current + AUTO_ROTATE_DEG_PER_FRAME);
      }

      frameIdRef.current = requestAnimationFrame(tick);
    }

    function startLoop(): void {
      if (isLoopRunningRef.current) return;
      isLoopRunningRef.current = true;
      frameIdRef.current = requestAnimationFrame(tick);
    }

    function resetPointerTracking(): void {
      dragAxisRef.current = "undecided";
      activePointerIdRef.current = null;
    }

    function onPointerDown(event: PointerEvent): void {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-ring-interactive]")) return;

      activePointerIdRef.current = event.pointerId;
      dragAxisRef.current = "undecided";
      dragStartXRef.current = event.clientX;
      dragStartYRef.current = event.clientY;
      dragStartRotationRef.current = rotationRef.current;
    }

    function onPointerMove(event: PointerEvent): void {
      if (activePointerIdRef.current !== event.pointerId) return;

      const deltaX = event.clientX - dragStartXRef.current;
      const deltaY = event.clientY - dragStartYRef.current;

      if (dragAxisRef.current === "undecided") {
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return;

        if (Math.abs(deltaY) >= Math.abs(deltaX)) {
          dragAxisRef.current = "vertical";
          resetPointerTracking();
          return;
        }

        dragAxisRef.current = "horizontal";
        isDraggingRef.current = true;
        setIsDragging(true);
        pauseAutoRotate();
        container!.setPointerCapture(event.pointerId);
        container!.style.cursor = "grabbing";
        startLoop();
      }

      if (dragAxisRef.current !== "horizontal" || !isDraggingRef.current) return;

      event.preventDefault();
      syncRotation(
        dragStartRotationRef.current + deltaX / DRAG_PIXELS_PER_DEGREE,
      );
    }

    function onPointerUp(event: PointerEvent): void {
      if (activePointerIdRef.current !== event.pointerId && !isDraggingRef.current) {
        return;
      }

      if (dragAxisRef.current === "horizontal" && isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        pauseAutoRotate();
        if (container!.hasPointerCapture(event.pointerId)) {
          container!.releasePointerCapture(event.pointerId);
        }
        container!.style.cursor = "grab";
      }

      resetPointerTracking();
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      event.preventDefault();
      pauseAutoRotate();
      const delta = event.key === "ArrowLeft" ? -KEYBOARD_NUDGE_DEGREES : KEYBOARD_NUDGE_DEGREES;
      syncRotation(rotationRef.current + delta);
      startLoop();
    }

    container.tabIndex = 0;
    container.style.cursor = "grab";
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    container.addEventListener("keydown", onKeyDown);
    startLoop();

    return () => {
      stopLoop();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      container.removeEventListener("keydown", onKeyDown);
      container.style.cursor = "";
      container.tabIndex = -1;
    };
  }, [count, pauseAutoRotate, syncRotation]);

  const { fractionalIndex, activeIndex } = getRingActiveState(rotationOffset, count);
  const ringItems = computeRingItems(
    count,
    rotationOffset,
    radius,
    minScale,
    maxScale,
    minOpacity,
    maxOpacity,
  );

  return {
    rotationOffset,
    fractionalIndex,
    activeIndex,
    ringItems,
    isDragging,
    containerRef,
  };
}
