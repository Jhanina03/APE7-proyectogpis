import { ShoppingBag } from "lucide-react";
import { EmailForm } from "@/components/email-form";
import { useResendVerification } from "@/lib/hooks/useAuth";
import type { EmailFormData } from "@/lib/validations/auth";

export default function ResendPage() {
  const resendMutation = useResendVerification();

  const handleSubmit = (data: EmailFormData) => {
    resendMutation.mutate(data);
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <ShoppingBag className="size-4" />
          </div>
          SafeTrade.
        </a>
        <EmailForm
          title="Resend Verification Code"
          description="Enter your email to receive a new verification code"
          submitText="Resend Code"
          onSubmit={handleSubmit}
          isLoading={resendMutation.isPending}
          error={resendMutation.error?.message}
        />
      </div>
    </div>
  );
}