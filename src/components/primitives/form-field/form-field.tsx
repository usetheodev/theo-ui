import { AlertCircle } from "lucide-react";
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
} from "react";
import type { HTMLAttributes, ReactElement, ReactNode } from "react";
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
    const described = hasError ? errorId : hintId;
    // Children.only enforces exactly one child element (the form control) so we
    // can safely clone it with the wiring props (id + aria-describedby + aria-invalid).
    // The previous implementation spread the element object directly which relied
    // on React's internal `$$typeof` invariant and silently dropped `ref` — the
    // cloneElement path preserves both `ref` and `key`.
    const only = Children.only(children) as ReactElement;
    const cloned = isValidElement(only)
      ? cloneElement(only, {
          id: fieldId,
          "aria-describedby": described,
          "aria-invalid": hasError || undefined,
        } as Partial<typeof only.props>)
      : only;
    return (
      <div ref={ref} {...props}>
        {cloned}
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

const FormField = /*#__PURE__*/ Object.assign(FormFieldRoot, {
  Label: FormFieldLabel,
  Control: FormFieldControl,
  Hint: FormFieldHint,
  Error: FormFieldError,
});

export { FormField };
