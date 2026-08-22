import type { GlobalRoleKey } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    organizationId?: string;
    roleKey?: GlobalRoleKey;
  }

  interface Session {
    user: {
      id: string;
      organizationId: string;
      roleKey: GlobalRoleKey;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    organizationId?: string;
    roleKey?: GlobalRoleKey;
  }
}
