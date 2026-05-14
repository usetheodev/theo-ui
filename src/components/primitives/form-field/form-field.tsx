import { AlertCircle } from "lucide-react";
import { createContext, forwardRef, useContext, useId } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { Label } from "../label/label.js";

/**
 * FormField — composition wrapper for accessible form rows.
 *
 * Provides context with a generated `id`, so children (Label, Input, Hint,
 * Error) wire themselves via `htmlFor` / `id` / `aria-describedby` without
 * the consumer having to thread IDs manually.
 *
 * Composition:
 *   <FormField>
 *     <FormField.Label required>Email</FormField.Label>
 *     <FormField.Control>
 *       <Input type="email" placeholder="…" />
 *     </FormField.Control>
 *     <FormField.Hint>We never share your email.</FormField.Hint>
 *     <FormField.Error>{error}</FormField.Error>
 *   </FormField>
 *
 * Errors take precedence over hints (only one of them shows at once).
 */

interface FormFieldContextValue {
  fieldId: string;
  hintId: string;
  errorId: string;
  hasError: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

function useFormField(): FormFieldContextValue {
  const ctx = useContext(FormFieldContext);
  if (!ctx) throw new Error("FormField subcomponents must be inside <FormField>.");
  return ctx;
}

interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional explicit id override. */
  id?: string;
  /** Marks the field as invalid; switches Hint → Error and toggles aria. */
  invalid?: boolean;
}

const FormFieldRoot = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, id: idProp, invalid, ...props }, ref) => {
    const auto = useId();
    const fieldId = idProp ?? `field-${auto}`;
    const ctx: FormFieldContextValue = {
      fieldId,
      hintId: `${fieldId}-hint`,
      errorId: `${fieldId}-error`,
      hasError: !!invalid,
    };
    return (
      <FormFieldContext.Provider value={ctx}>
        <div ref={ref} className={cn("grid gap-1.5", className)} {...props} />
      </FormFieldContext.Provider>
    );
  },
);
FormFieldRoot.displayName = "FormField";

interface FormFieldLabelProps extends HTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const FormFieldLabel = forwardRef<HTMLLabelElement, FormFieldLabelProps>(
  ({ children, ...props }, ref) => {
    const { fieldId } = useFormField();
    return (
      <Label ref={ref} htmlFor={fieldId} {...props}>
        {children}
      </Label>
    );
  },
);
FormFieldLabel.displayName = "FormField.Label";

const FormFieldControl = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    const { fieldId, hintId, errorId, hasError } = useFormField();
    // Inject id + aria-describedby + aria-invalid on the SINGLE child input.
    const child = (children as React.ReactElement) ?? null;
    const described = hasError ? errorId : hintId;
    return (
      <div ref={ref} {...props}>
        {child && typeof child === "object"
          ? {
              ...child,
              props: {
                ...(child.props ?? {}),
                id: fieldId,
                "aria-describedby": described,
                "aria-invalid": hasError || undefined,
              },
            }
          : child}
      </div>
    );
  },
);
FormFieldControl.displayName = "FormField.Control";

const FormFieldHint = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { hintId, hasError } = useFormField();
    if (hasError) return null;
    return (
      <p
        ref={ref}
        id={hintId}
        className={cn("text-body-sm text-muted-foreground", className)}
        {...props}
      >
        {children}
      </p>
    );
  },
);
FormFieldHint.displayName = "FormField.Hint";

const FormFieldError = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { errorId, hasError } = useFormField();
    if (!hasError) return null;
    return (
      <p
        ref={ref}
        id={errorId}
        role="alert"
        className={cn("flex items-center gap-1 text-body-sm text-destructive", className)}
        {...props}
      >
        <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
        {children as ReactNode}
      </p>
    );
  },
);
FormFieldError.displayName = "FormField.Error";

const FormField = FormFieldRoot as typeof FormFieldRoot & {
  Label: typeof FormFieldLabel;
  Control: typeof FormFieldControl;
  Hint: typeof FormFieldHint;
  Error: typeof FormFieldError;
};
FormField.Label = FormFieldLabel;
FormField.Control = FormFieldControl;
FormField.Hint = FormFieldHint;
FormField.Error = FormFieldError;

export { FormField };
