import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/user';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: 'admin-credentials',
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return { id: 'admin', name: 'Root Admin', email, role: 'admin' };
        }
        return null;
      },
    }),
    Credentials({
      id: 'user-credentials',
      name: 'User',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        try {
          await connectDB();
          const user = await User.findOne({ email: email.toLowerCase() });
          if (!user || !user.password) return null;

          const valid = await user.comparePassword(password);
          if (!valid) return null;

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            role: 'user',
            userId: user._id.toString(),
          };
        } catch (err) {
          console.error('[auth] Error during user authorization:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await connectDB();
          const existing = await User.findOne({ email: user.email?.toLowerCase() });
          if (!existing) {
            const newUser = await User.create({
              name: user.name || 'User',
              email: user.email?.toLowerCase() || '',
              image: user.image || undefined,
              provider: 'google',
              googleId: account.providerAccountId,
            });
            (user as Record<string, unknown>).id = (newUser as any)._id.toString();
            (user as Record<string, unknown>).userId = (newUser as any)._id.toString();
          } else {
            if (!existing.googleId) {
              existing.googleId = account.providerAccountId;
              existing.provider = 'google';
              if (!existing.image && user.image) existing.image = user.image;
              await existing.save();
            }
            (user as Record<string, unknown>).id = existing._id.toString();
            (user as Record<string, unknown>).userId = existing._id.toString();
          }
          (user as Record<string, unknown>).role = 'user';
        } catch (err) {
          console.error('[auth] Google sign-in error:', err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role as string;
        token.userId = (user as Record<string, unknown>).userId as string | undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = session.user as any;
        user.role = token.role;
        user.userId = token.userId;
        user.id = token.userId || token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
});
