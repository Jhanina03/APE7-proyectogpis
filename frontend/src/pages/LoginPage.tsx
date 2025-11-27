import { LoginForm } from "@/components/login-form";
import { useLogin } from "@/lib/hooks/useAuth";
import type { LoginFormData } from "@/lib/validations/auth";

export default function LoginPage() {
  const loginMutation = useLogin();

  const handleSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <LoginForm
          onSubmit={handleSubmit}
          isLoading={loginMutation.isPending}
        />
        {loginMutation.isError && (
          <div className="mt-4 text-center text-sm text-red-600">
            {loginMutation.error instanceof Error
              ? loginMutation.error.message
              : "Login failed. Please try again."}
          </div>
        )}
      </div>
    </div>
  );
}
