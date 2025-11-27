import { ShoppingBag } from "lucide-react";
import { OTPForm } from "@/components/otp-form";
import { useVerify } from "@/lib/hooks/useAuth";
import type { OtpFormData } from "@/lib/validations/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  const verifyMutation = useVerify();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Try to get email from navigation state first, then sessionStorage
    const stateEmail = location.state?.email;
    const sessionEmail = sessionStorage.getItem("pendingVerificationEmail");

    const emailToUse = stateEmail || sessionEmail;

    if (!emailToUse) {
      // No email found, redirect to signup
      navigate("/signup");
      return;
    }

    setEmail(emailToUse);
  }, [location.state, navigate]);

  const handleSubmit = (data: OtpFormData) => {
    verifyMutation.mutate(data);
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-xs flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <ShoppingBag className="size-4" />
          </div>
          SafeTrade.
        </a>
        <OTPForm
          email={email}
          onSubmit={handleSubmit}
          isLoading={verifyMutation.isPending}
          error={verifyMutation.error?.message}
        />
      </div>
    </div>
  );
}
