import { Edit, Trash2, User } from "lucide-react";
import { DropdownMenu } from "@theokit/ui";



export const Default = () => (
  <DropdownMenu>
    <DropdownMenu.Trigger className="rounded-md border border-border/60 px-3 py-1.5 font-sans text-body-sm">
      Open menu
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Item>Edit</DropdownMenu.Item>
      <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item>Delete</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu>
);

export const WithLabel = () => (
  <DropdownMenu>
    <DropdownMenu.Trigger className="rounded-md border border-border/60 px-3 py-1.5 font-sans text-body-sm">
      Actions
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Label>Project</DropdownMenu.Label>
      <DropdownMenu.Item>Rename</DropdownMenu.Item>
      <DropdownMenu.Item>Transfer ownership</DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Label>Danger</DropdownMenu.Label>
      <DropdownMenu.Item>Delete project</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu>
);

export const WithIcons = () => (
  <DropdownMenu>
    <DropdownMenu.Trigger className="rounded-md border border-border/60 px-3 py-1.5 font-sans text-body-sm">
      Open
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Item>
        <Edit aria-hidden="true" className="size-3.5" />
        Edit
      </DropdownMenu.Item>
      <DropdownMenu.Item>
        <User aria-hidden="true" className="size-3.5" />
        Manage members
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item>
        <Trash2 aria-hidden="true" className="size-3.5" />
        Delete
        <DropdownMenu.Shortcut>⌘⌫</DropdownMenu.Shortcut>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu>
);

export const WithCheckboxItems = () => (
  <DropdownMenu>
    <DropdownMenu.Trigger className="rounded-md border border-border/60 px-3 py-1.5 font-sans text-body-sm">
      View options
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.CheckboxItem checked>Show toolbar</DropdownMenu.CheckboxItem>
      <DropdownMenu.CheckboxItem>Show sidebar</DropdownMenu.CheckboxItem>
      <DropdownMenu.CheckboxItem>Full screen</DropdownMenu.CheckboxItem>
    </DropdownMenu.Content>
  </DropdownMenu>
);

export const WithDisabledItem = () => (
  <DropdownMenu>
    <DropdownMenu.Trigger className="rounded-md border border-border/60 px-3 py-1.5 font-sans text-body-sm">
      Open
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Item>Available action</DropdownMenu.Item>
      <DropdownMenu.Item disabled>Disabled action</DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item>Another action</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu>
);
