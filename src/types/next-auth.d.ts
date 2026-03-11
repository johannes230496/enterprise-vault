import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      globalRole: string;
      organizationId: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    globalRole: string;
    organizationId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    globalRole: string;
    organizationId: string;
  }
}
