import type { z } from 'zod';

export type FieldErrors = Record<string, string>;

const WHOLE_FORM_FIELD = 'form';

export function toFieldErrors(validationError: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of validationError.issues) {
    const fieldName = issue.path.join('.') || WHOLE_FORM_FIELD;
    fieldErrors[fieldName] ??= issue.message;
  }
  return fieldErrors;
}

export type ValidationResult<Output> =
  { isValid: true; data: Output } | { isValid: false; fieldErrors: FieldErrors };

export function validateWithSchema<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): ValidationResult<z.infer<Schema>> {
  const parsedInput = schema.safeParse(input);
  if (parsedInput.success) {
    return { isValid: true, data: parsedInput.data };
  }
  return { isValid: false, fieldErrors: toFieldErrors(parsedInput.error) };
}
