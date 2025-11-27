import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { emailSchema, type EmailFormData } from "@/lib/validations/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";

interface EmailFormProps {
  className?: string;
  title?: string;
  description?: string;
  submitText?: string;
  onSubmit: (data: EmailFormData) => void;
  isLoading?: boolean;
  error?: string;
}

export function EmailForm({
  className,
  title = "Enter your email",
  description = "We'll send you a verification code",
  submitText = "Send Code",
  onSubmit,
  isLoading,
  error,
}: EmailFormProps) {
  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  disabled={isLoading}
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
                {error && (
                  <p className="text-sm text-destructive mt-1">{error}</p>
                )}
              </Field>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : submitText}
              </Button>
            </FieldGroup>
          </form>
          <div className="flex items-center justify-center mt-5">
            <FieldDescription>
              Back to <Link to="/login">Login</Link>
            </FieldDescription>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
