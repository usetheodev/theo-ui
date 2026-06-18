"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
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
import type {
  ComponentPropsWithoutRef,
  ElementRef,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from "react";
import { cn } from "../../../lib/cn.js";

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

type FormFieldSize = "sm" | "md" | "lg";

interface FormFieldContextValue {
  fieldId: string;
  hintId: string;
  errorId: string;
  hasError: boolean;
  size: FormFieldSize;
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
  /**
   * Size scale propagated to Label / Hint / Error subparts via Context.
   * Default `md` preserves prior behavior. Subparts do NOT accept a `size`
   * prop of their own — use `className` for granular tweaks (EC-8).
   */
  size?: FormFieldSize;
}

const rootGapBySize: Record<FormFieldSize, string> = {
  sm: "gap-1",
  md: "gap-1.5",
  lg: "gap-2",
};

const FormFieldRoot = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, id: idProp, invalid, size = "md", ...props }, ref) => {
    const auto = useId();
    const fieldId = idProp ?? `field-${auto}`;
    const ctx: FormFieldContextValue = {
      fieldId,
      hintId: `${fieldId}-hint`,
      errorId: `${fieldId}-error`,
      hasError: !!invalid,
      size,
    };
    return (
      <FormFieldContext.Provider value={ctx}>
        <div ref={ref} className={cn("grid", rootGapBySize[size], className)} {...props} />
      </FormFieldContext.Provider>
    );
  },
);
FormFieldRoot.displayName = "FormField";

const labelFontBySize: Record<FormFieldSize, string> = {
  sm: "text-label-caps",
  md: "text-body-sm",
  lg: "text-body-md",
};

const hintFontBySize: Record<FormFieldSize, string> = {
  sm: "text-label-caps",
  md: "text-body-sm",
  lg: "text-body-md",
};

interface FormFieldLabelProps extends ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  required?: boolean;
}

// Inlined label markup (was importing `<Label>` from sibling primitive).
// BLOCKER-001 / D2: form-field stays in primitives/ but cannot cross-import.
// Uses the same Radix LabelPrimitive primitive that the standalone `<Label>`
// uses, with identical Tailwind tokens — visual parity is preserved.
const FormFieldLabel = forwardRef<ElementRef<typeof LabelPrimitive.Root>, FormFieldLabelProps>(
  ({ className, required, children, ...props }, ref) => {
    const { fieldId, size } = useFormField();
    return (
      <LabelPrimitive.Root
        ref={ref}
        htmlFor={fieldId}
        className={cn(
          "inline-flex items-center gap-1 font-medium font-sans text-foreground",
          labelFontBySize[size],
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
          className,
        )}
        {...props}
      >
        {children}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </LabelPrimitive.Root>
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
    const { hintId, hasError, size } = useFormField();
    if (hasError) return null;
    return (
      <p
        ref={ref}
        id={hintId}
        className={cn("text-muted-foreground", hintFontBySize[size], className)}
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
    const { errorId, hasError, size } = useFormField();
    if (!hasError) return null;
    return (
      <p
        ref={ref}
        id={errorId}
        role="alert"
        className={cn("flex items-center gap-1 text-destructive", hintFontBySize[size], className)}
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
