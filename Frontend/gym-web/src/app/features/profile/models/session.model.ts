export interface Session {
  tokenId: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}
