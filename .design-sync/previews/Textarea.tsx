import { FormField } from "@theokit/ui";
import { Textarea } from "@theokit/ui";



export const Inline = () => (
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
