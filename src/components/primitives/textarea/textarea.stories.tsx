import type { Story } from "@ladle/react";
import { FormField } from "../form-field/form-field.js";
import { Textarea } from "./textarea.js";

export default { title: "Primitives / Foundations / Textarea" };

export const Inline: Story = () => (
  <div className="max-w-md">
    <FormField>
      <FormField.Label>Project description</FormField.Label>
      <FormField.Control>
        <Textarea placeholder="What does this project do?" rows={4} />
      </FormField.Control>
      <FormField.Hint>Markdown is supported. Max 2,000 characters.</FormField.Hint>
    </FormField>
  </div>
);
