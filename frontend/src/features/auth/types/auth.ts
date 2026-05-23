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

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  user: UserProfile;
} & AuthTokens;

export type EmailLoginInput = {
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
