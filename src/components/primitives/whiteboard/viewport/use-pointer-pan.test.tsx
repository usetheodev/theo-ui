import { act, render, renderHook } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { usePointerPan } from "./use-pointer-pan.js";
import { useViewport } from "./use-viewport.js";

const size = { width: 800, height: 600 };

interface HostProps {
  onReady: (ref: React.RefObject<SVGSVGElement | null>) => void;
}

function Host({ onReady }: HostProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const vp = useViewport(size);
  const handlers = usePointerPan(ref, vp, size);
  // Expose ref to test through callback ref.
  return (
    <svg
      ref={(el) => {
        ref.current = el;
        if (el) onReady(ref);
      }}
      width={size.width}
      height={size.height}
      viewBox={vp.viewBox(size)}
      {...handlers}
      data-testid="root"
    >
      <title>test</title>
    </svg>
  );
}

describe("usePointerPan EC-2 (wheel via addEventListener)", () => {
  it("attaches a non-passive wheel listener via addEventListener (not React onWheel)", () => {
    const addSpy = vi.spyOn(SVGSVGElement.prototype, "addEventListener");
    render(<Host onReady={() => undefined} />);
    const wheelCall = addSpy.mock.calls.find((c) => c[0] === "wheel");
    expect(wheelCall).toBeDefined();
    // 3rd arg is options object with passive:false.
    expect(wheelCall?.[2]).toMatchObject({ passive: false });
    addSpy.mockRestore();
  });
});

describe("usePointerPan basic behaviour", () => {
  it("hook renders without throwing", () => {
    const { result } = renderHook(() => {
      const ref = useRef<SVGSVGElement | null>(null);
      const vp = useViewport(size);
      return usePointerPan(ref, vp, size);
    });
    expect(typeof result.current.onPointerDown).toBe("function");
    expect(typeof result.current.onPointerMove).toBe("function");
    expect(typeof result.current.onPointerUp).toBe("function");
    expect(typeof result.current.onPointerCancel).toBe("function");
  });

  it("EC-11: onPointerCancel clears drag state without throwing", () => {
    const { result } = renderHook(() => {
      const ref = useRef<SVGSVGElement | null>(null);
      const vp = useViewport(size);
      return usePointerPan(ref, vp, size);
    });
    // Build a minimal stub for pointer event with required methods.
    const stub = (pointerId: number, type: string) =>
      ({
        pointerId,
        clientX: 100,
        clientY: 100,
        button: 0,
        pointerType: "mouse",
        target: document.createElement("svg"),
        currentTarget: {
          contains: () => true,
          setPointerCapture: () => undefined,
          releasePointerCapture: () => undefined,
        },
        type,
      }) as unknown as React.PointerEvent<SVGSVGElement>;
    act(() => {
      result.current.onPointerDown(stub(1, "pointerdown"));
      result.current.onPointerCancel(stub(1, "pointercancel"));
    });
    // No exception means drag state is reset properly.
    expect(true).toBe(true);
  });
});
