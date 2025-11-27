import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useResetPassword } from "@/lib/hooks/useAuth";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/auth";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function ResetPasswordPage() {
  const resetMutation = useResetPassword();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Try to get email from navigation state or sessionStorage
    const stateEmail = location.state?.email;
    const sessionEmail = sessionStorage.getItem("pendingPasswordResetEmail");

    const emailToUse = stateEmail || sessionEmail;

    if (!emailToUse) {
      // No email found, redirect to forgot password
      navigate("/forgot-password");
      return;
    }

    setEmail(emailToUse);
  }, [location.state, navigate]);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email,
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update email in form when it's loaded
  useEffect(() => {
    if (email) {
      form.setValue("email", email);
    }
  }, [email, form]);

  const handleSubmit = (data: ResetPasswordFormData) => {
    resetMutation.mutate(data);
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
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Reset Your Password</CardTitle>
            <CardDescription>
              Enter the code sent to {email || "your email"} and your new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <FieldGroup>
                {/* Hidden email field */}
                <input type="hidden" {...form.register("email")} />

                {/* Verification Code */}
                <Field>
                  <FieldLabel htmlFor="code">Verification Code</FieldLabel>
                  <Controller
                    name="code"
                    control={form.control}
                    render={({ field }) => (
                      <InputOTP
                        maxLength={6}
                        id="code"
                        disabled={resetMutation.isPending}
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    )}
                  />
                  {form.formState.errors.code && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.code.message}
                    </p>
                  )}
                </Field>

                {/* New Password */}
                <Field>
                  <FieldLabel htmlFor="password">New Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    disabled={resetMutation.isPending}
                    {...form.register("newPassword")}
                  />
                  {form.formState.errors.newPassword && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.newPassword.message}
                    </p>
                  )}
                </Field>

                {/* Confirm Password */}
                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    disabled={resetMutation.isPending}
                    {...form.register("confirmPassword")}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </Field>

                {resetMutation.error && (
                  <p className="text-sm text-destructive text-center">
                    {resetMutation.error.message}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
                  {resetMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
