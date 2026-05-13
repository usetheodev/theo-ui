import type { Story } from "@ladle/react";
import { FolderSelector } from "./folder-selector.js";

export default { title: "Primitives / Chat / FolderSelector" };

export const Sizes: Story = () => (
  <div className="grid max-w-xl gap-3">
    <FolderSelector path="C:\Users\AlfredoAraujo\Downloads\capturas" />
    <FolderSelector path="~/Code/usetheo/theo-desktop" />
    <FolderSelector compact path="~/Downloads" />
  </div>
);
