import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { useAuth as useAuthContext, type User } from '@/contexts/AuthContext';
import type {
  LoginFormData,
  OtpFormData,
  SignupFormData,
  EmailFormData,
  ResetPasswordFormData
} from '@/lib/validations/auth';

// Backend response types (matching AUTH_DOCUMENTATION.md)
interface LoginResponse {
  accessToken: string;
  user: User;
}

interface MessageResponse {
  message: string;
}

// Login hook
export function useLogin() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuthContext();

  return useMutation({
    mutationFn: async (data: LoginFormData): Promise<LoginResponse> => {
      return apiClient.post<LoginResponse>(API_ENDPOINTS.auth.login, data);
    },
    onSuccess: (response) => {
      // Store token and user in AuthContext
      setAuth(response.accessToken, response.user);
      toast.success('Welcome back!', {
        description: `You've successfully logged in.`,
      });
      // Navigate to marketplace home
      navigate('/');
    },
    onError: (error) => {
      console.error('Login failed:', error);
      toast.error('Login failed', {
        description: error instanceof Error ? error.message : 'Please check your credentials and try again.',
      });
    },
  });
}

// Signup/Register hook
export function useSignup() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: SignupFormData): Promise<MessageResponse> => {
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...signupData } = data;
      return apiClient.post<MessageResponse>(API_ENDPOINTS.auth.register, signupData);
    },
    onSuccess: (_response, variables) => {
      if (_response.message === "Account exists but not verified. Verification code resent.") {
        toast.warning('Account already registered!', {
          description: 'Account exists, but is not verified. Please check the verification code resent in your email.',
        });
      } else {
        toast.success('Account created!', {
          description: 'Please check your email for a verification code.',
        });
      }

      sessionStorage.setItem('pendingVerificationEmail', variables.email);
      // Navigate to verify page
      navigate('/verify', { state: { email: variables.email } });
    },
    onError: (error) => {
      console.error('Signup failed:', error);
      toast.error('Signup failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

export function useVerify() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: OtpFormData): Promise<MessageResponse> => {
      return apiClient.post<MessageResponse>(API_ENDPOINTS.auth.verify, data);
    },
    onSuccess: () => {
      toast.success('Email verified!', {
        description: 'Your account has been verified. You can now log in.',
      });
      sessionStorage.removeItem('pendingVerificationEmail');
      navigate('/login');
    },
    onError: (error) => {
      console.error('Verification failed:', error);
      toast.error('Verification failed', {
        description: error instanceof Error ? error.message : 'Invalid or expired code. Please try again.',
      });
    },
  });
}

// Resend Verification Code hook
export function useResendVerification() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: EmailFormData): Promise<MessageResponse> => {
      return apiClient.post<MessageResponse>(API_ENDPOINTS.auth.resend, data);
    },
    onSuccess: (_response, variables) => {
      toast.success('Code sent!', {
        description: 'A new verification code has been sent to your email.',
      });
      // Store email and navigate to verify page
      sessionStorage.setItem('pendingVerificationEmail', variables.email);
      navigate('/verify', { state: { email: variables.email } });
    },
    onError: (error) => {
      console.error('Resend failed:', error);
      toast.error('Failed to resend code', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

// Forgot Password hook (sends recovery code to email)
export function useForgotPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: EmailFormData): Promise<MessageResponse> => {
      return apiClient.post<MessageResponse>(API_ENDPOINTS.auth.forgot, data);
    },
    onSuccess: (_response, variables) => {
      toast.success('Reset code sent!', {
        description: 'Please check your email for a password reset code.',
      });
      // Store email and navigate to reset password page
      sessionStorage.setItem('pendingPasswordResetEmail', variables.email);
      navigate('/reset-password', { state: { email: variables.email } });
    },
    onError: (error) => {
      console.error('Forgot password failed:', error);
      toast.error('Failed to send reset code', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

// Reset Password hook
export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: ResetPasswordFormData): Promise<MessageResponse> => {
      // Remove confirmPassword before sending
      const { confirmPassword, ...resetData } = data;
      return apiClient.post<MessageResponse>(API_ENDPOINTS.auth.reset, resetData);
    },
    onSuccess: () => {
      toast.success('Password reset successful!', {
        description: 'You can now log in with your new password.',
      });
      // Clear email from sessionStorage
      sessionStorage.removeItem('pendingPasswordResetEmail');
      // Navigate to login
      navigate('/login');
    },
    onError: (error) => {
      console.error('Password reset failed:', error);
      toast.error('Password reset failed', {
        description: error instanceof Error ? error.message : 'Invalid code or password. Please try again.',
      });
    },
  });
}

// Logout hook
export function useLogout() {
  const navigate = useNavigate();
  const { logout: clearAuth } = useAuthContext();

  return useMutation({
    mutationFn: async (): Promise<MessageResponse> => {
      return apiClient.post<MessageResponse>(API_ENDPOINTS.auth.logout);
    },
    onSuccess: () => {
      // Clear auth state
      clearAuth();
      toast.success('Logged out', {
        description: 'You have been successfully logged out.',
      });
      // Navigate to login page
      navigate('/login');
    },
    onError: (error) => {
      // Even if API call fails, clear local auth state
      clearAuth();
      console.error('Logout failed:', error);
      toast.info('Logged out', {
        description: 'You have been logged out.',
      });
      navigate('/login');
    },
  });
}
