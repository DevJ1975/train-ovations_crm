import type { DefaultSession } from 'next-auth';
import type { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: UserRole;
      mustChangePassword: boolean;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    mustChangePassword: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      mustChangePassword: boolean;
    };
  }
}
