export type UserRole = 'USER' | 'ADMIN';

export type AuthProvider = 'EMAIL' | 'PHONE' | 'GOOGLE';

export type UserProfile = {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  fullName: string | null;
  role: UserRole;
  provider: AuthProvider;
};

export type AuthResponse = {
  user: UserProfile;
  accessToken: string;
};

export type EmailLoginInput = {
  email: string;
  password: string;
};

export type EmailSignupInput = {
  fullName?: string;
  email: string;
  password: string;
};

export type PhoneRequestOtpInput = {
  phoneNumber: string;
};

export type PhoneVerifyOtpInput = {
  phoneNumber: string;
  otp: string;
};

export type GoogleLoginInput = {
  idToken: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ForgotPasswordResponse = {
  message: string;
  resetToken?: string;
};

export type ResetPasswordInput = {
  token: string;
  password: string;
};
