interface FormFieldErrorProps {
  error?: string;
}

export function FormFieldError({ error }: FormFieldErrorProps) {
  if (!error) return null;

  return <p className="text-sm text-destructive mt-1">{error}</p>;
}
