export interface LoginResponse {
  requiresTwoFactor: boolean;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  isNewUser?: boolean;
}
