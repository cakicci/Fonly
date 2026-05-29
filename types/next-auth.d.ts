import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isPremium?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isPremium?: boolean;
    /** Premium kontrolünün son yapıldığı timestamp (epoch ms). 5 dk'da bir refresh. */
    premiumCheckedAt?: number;
  }
}
