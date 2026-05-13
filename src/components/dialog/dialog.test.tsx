import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "../button/button.js";
import { Dialog } from "./dialog.js";

function Example() {
  return (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button>Open</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Delete project</Dialog.Title>
          <Dialog.Description>This action is irreversible.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>The project and all its deployments will be removed.</Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Dialog.Close>
          <Button variant="destructive">Delete</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("is closed by default", () => {
    render(<Example />);
    expect(screen.queryByText("Delete project")).not.toBeInTheDocument();
  });

  it("opens on trigger click", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Delete project")).toBeInTheDocument();
    expect(screen.getByText("This action is irreversible.")).toBeInTheDocument();
  });

  it("closes via Close button", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Delete project")).not.toBeInTheDocument();
  });
});
