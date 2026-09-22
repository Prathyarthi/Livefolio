import { cn } from "@/lib/utils";
import { EDIT_FORM_FIELD_CLASS } from "@/features/dashboard/constants/form-layout";

type FormFieldProps = {
  children: React.ReactNode;
  className?: string;
  error?: string;
};

export function FormField({ children, className, error }: FormFieldProps) {
  return (
    <div className={cn(EDIT_FORM_FIELD_CLASS, className)}>
      {children}
      {error ? (
        <p className="text-body-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
