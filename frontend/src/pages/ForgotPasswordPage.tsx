import { ShoppingBag } from "lucide-react";
import { EmailForm } from "@/components/email-form";
import { useForgotPassword } from "@/lib/hooks/useAuth";
import type { EmailFormData } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const forgotMutation = useForgotPassword();

  const handleSubmit = (data: EmailFormData) => {
    forgotMutation.mutate(data);
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <ShoppingBag className="size-4" />
          </div>
          SafeTrade
        </a>
        <EmailForm
          title="Forgot Password"
          description="Enter your email to receive a password reset code"
          submitText="Send Reset Code"
          onSubmit={handleSubmit}
          isLoading={forgotMutation.isPending}
          error={forgotMutation.error?.message}
        />
      </div>
    </div>
  );
}
