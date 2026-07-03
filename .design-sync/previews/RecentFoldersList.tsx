import { useState } from "react";
import { RecentFoldersList } from "@theokit/ui";



const FOLDERS = [
  { id: "1", name: "Downloads", path: "/Users/Alfredo/Downloads" },
  { id: "2", name: "Documents/Projects", path: "/Users/Alfredo/Documents/Projects" },
  { id: "3", name: "Desktop/Screenshots", path: "/Users/Alfredo/Desktop/Screenshots" },
  { id: "4", name: "Code/my-app", path: "/Users/Alfredo/Code/my-app" },
];

export const Interactive = () => {
  const [active, setActive] = useState("2");
  return (
    <RecentFoldersList
      className="max-w-md"
      folders={FOLDERS.map((f) => ({ ...f, active: f.id === active }))}
      onSelect={setActive}
    />
  );
};
