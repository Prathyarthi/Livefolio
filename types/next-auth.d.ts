import "next-auth";
import type { AccountType } from "@/lib/account-type";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      accountType: AccountType;
    };
  }
  interface User {
    avatar?: string;
    accountType?: AccountType;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    avatar?: string;
    accountType?: AccountType;
  }
}
