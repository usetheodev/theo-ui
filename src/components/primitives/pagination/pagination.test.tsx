import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Pagination, computePageRange } from "./pagination.js";

describe("computePageRange (pure)", () => {
  it("returns empty when totalPages <= 1", () => {
    expect(computePageRange(1, 1, 1)).toEqual([]);
    expect(computePageRange(1, 0, 1)).toEqual([]);
  });

  it("returns full range when small (<=7 with siblingCount=1)", () => {
    // siblingCount*2+5 = 7 → totalPages <= 7 returns full range
    expect(computePageRange(3, 7, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("ellipsis only on right when near start", () => {
    const result = computePageRange(2, 42, 1);
    expect(result).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 42]);
  });

  it("ellipsis only on left when near end", () => {
    const result = computePageRange(41, 42, 1);
    expect(result).toEqual([1, "ellipsis-start", 38, 39, 40, 41, 42]);
  });

  it("ellipsis on both sides when in middle", () => {
    const result = computePageRange(20, 42, 1);
    expect(result).toEqual([1, "ellipsis-start", 19, 20, 21, "ellipsis-end", 42]);
  });

  it("siblingCount=0 → just current page between ellipses", () => {
    const result = computePageRange(20, 42, 0);
    expect(result).toEqual([1, "ellipsis-start", 20, "ellipsis-end", 42]);
  });
});

describe("Pagination — rendering", () => {
  it("renders nothing when totalPages <= 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => undefined} />,
    );
    expect(container.querySelector("nav")).toBeNull();
  });

  it("prev + first disabled on page 1", () => {
    render(<Pagination currentPage={1} totalPages={10} onPageChange={() => undefined} />);
    expect(screen.getByLabelText("Go to previous page")).toBeDisabled();
    expect(screen.getByLabelText("Go to first page")).toBeDisabled();
  });

  it("next + last disabled on last page", () => {
    render(<Pagination currentPage={10} totalPages={10} onPageChange={() => undefined} />);
    expect(screen.getByLabelText("Go to next page")).toBeDisabled();
    expect(screen.getByLabelText("Go to last page")).toBeDisabled();
  });

  it("all pages visible when totalPages <= 7", () => {
    render(<Pagination currentPage={3} totalPages={7} onPageChange={() => undefined} />);
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByLabelText(`Go to page ${i}`)).toBeInTheDocument();
    }
  });

  it("ellipsis rendered when totalPages is large", () => {
    const { container } = render(
      <Pagination currentPage={20} totalPages={42} onPageChange={() => undefined} />,
    );
    expect(container.textContent).toContain("…");
  });

  it("active page has aria-current=page", () => {
    render(<Pagination currentPage={3} totalPages={7} onPageChange={() => undefined} />);
    expect(screen.getByLabelText("Go to page 3")).toHaveAttribute("aria-current", "page");
  });

  it("showJumpButtons=false hides first/last buttons", () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={7}
        onPageChange={() => undefined}
        showJumpButtons={false}
      />,
    );
    expect(screen.queryByLabelText("Go to first page")).toBeNull();
    expect(screen.queryByLabelText("Go to last page")).toBeNull();
  });
});

describe("Pagination — interaction", () => {
  it("click on page number fires onPageChange", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={7} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText("Go to page 5"));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it("clicking the active page does NOT re-fire onPageChange", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={7} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText("Go to page 3"));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("ArrowRight advances to next page", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={7} onPageChange={onPageChange} />);
    const nav = screen.getByRole("navigation");
    fireEvent.keyDown(nav, { key: "ArrowRight" });
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("ArrowLeft goes to previous page", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={7} onPageChange={onPageChange} />);
    fireEvent.keyDown(screen.getByRole("navigation"), { key: "ArrowLeft" });
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("Home jumps to first page", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);
    fireEvent.keyDown(screen.getByRole("navigation"), { key: "Home" });
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("End jumps to last page", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);
    fireEvent.keyDown(screen.getByRole("navigation"), { key: "End" });
    expect(onPageChange).toHaveBeenCalledWith(10);
  });
});

describe("Pagination — a11y", () => {
  it("has no axe violations (default)", async () => {
    const { container } = render(
      <Pagination currentPage={3} totalPages={10} onPageChange={() => undefined} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (many pages with ellipsis)", async () => {
    const { container } = render(
      <Pagination currentPage={20} totalPages={42} onPageChange={() => undefined} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
