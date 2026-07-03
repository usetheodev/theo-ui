import { Input } from "@theokit/ui";
import { FormField } from "@theokit/ui";



export const Variants = () => (
  <div className="grid max-w-sm gap-4">
    <FormField>
      <FormField.Label>Project name</FormField.Label>
      <FormField.Control>
        <Input placeholder="acme-api" />
      </FormField.Control>
      <FormField.Hint>Lowercase, dashes allowed.</FormField.Hint>
    </FormField>

    <FormField>
      <FormField.Label required>Email</FormField.Label>
      <FormField.Control>
        <Input type="email" placeholder="you@theokit.dev" />
      </FormField.Control>
      <FormField.Hint>We never share your email.</FormField.Hint>
    </FormField>

    <FormField invalid>
      <FormField.Label required>API token</FormField.Label>
      <FormField.Control>
        <Input type="password" placeholder="••••••••" defaultValue="123" />
      </FormField.Control>
      <FormField.Hint>Paste your secret token.</FormField.Hint>
      <FormField.Error>Token must be at least 32 characters.</FormField.Error>
    </FormField>
  </div>
);
