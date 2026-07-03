import { useState } from "react";
import { Button } from "@theokit/ui";
import { PermissionModal } from "@theokit/ui";



export const Default = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open permission modal</Button>
      <PermissionModal
        open={open}
        onOpenChange={setOpen}
        request={{
          path: "C:\\Users\\AlfredoAraujo\\Downloads\\capturas",
          operations: ["read", "write", "delete"],
        }}
        onDecide={(d) => {
          console.warn("decision", d);
          setOpen(false);
        }}
      />
    </>
  );
};
