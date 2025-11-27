import { SignupForm } from "@/components/signup-form";
import { FieldDescription } from "@/components/ui/field";
import { useSignup } from "@/lib/hooks/useAuth";
import type { SignupFormData } from "@/lib/validations/auth";
import { HandbagIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function SignupPage() {
  const signupMutation = useSignup();

  const handleSubmit = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-8 items-center justify-center rounded-md">
            <HandbagIcon className="size-6" />
          </div>
          <span className="sr-only">SafeTrade.</span>

          <h1 className="text-xl font-bold">Welcome to SafeTrade.</h1>
          <FieldDescription>
            Already have an account? <Link to="/login">Sign in</Link>
          </FieldDescription>
        </div>
        <SignupForm
          onSubmit={handleSubmit}
          isLoading={signupMutation.isPending}
        />
        {signupMutation.isError && (
          <div className="mt-4 text-center text-sm text-red-600">
            {signupMutation.error instanceof Error
              ? signupMutation.error.message
              : "Signup failed. Please try again."}
          </div>
        )}
      </div>
    </div>
  );
}
