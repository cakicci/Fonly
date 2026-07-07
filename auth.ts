import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isPremium } from "@/lib/auth/premium";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Brute-force koruması: aynı IP'den 10 dakikada 15'ten fazla giriş denemesi
 * reddedilir. `code` client'a ulaşır (LoginForm bunu Türkçe mesaja çevirir).
 * Limit, meşru "şifremi mi yanlış yazdım" denemelerine bol pay bırakır.
 */
class LoginRateLimited extends CredentialsSignin {
  code = "rate_limited";
}

// Premium durumu JWT'de cache'lenir; her istekte DB'ye gitmemek için 5dk'lık
// bir refresh aralığı uygulanır. Abonelik başladığında/bittiğinde kullanıcı
// en geç 5dk içinde doğru duruma geçer.
const PREMIUM_REFRESH_MS = 5 * 60 * 1000;

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email ve şifre",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Şifre", type: "password" }
    },
    async authorize(credentials, request) {
      const ip = getClientIp(request);
      const { ok } = rateLimit(`login:${ip}`, { limit: 15, windowMs: 10 * 60_000 });
      if (!ok) {
        throw new LoginRateLimited();
      }

      const parsed = credentialsSchema.safeParse(credentials);

      if (!parsed.success) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() }
      });

      if (!user?.passwordHash) {
        return null;
      }

      const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);

      if (!passwordMatches) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image
      };
    }
  })
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Aynı e-posta = aynı kişi varsayımı: kullanıcı önce e-posta/şifre ile
      // kayıt olup sonra aynı e-postayla Google'a basarsa, bu olmadan NextAuth
      // `OAuthAccountNotLinked` hatası verir. Linklemeyi açarak iki yöntemi
      // tek hesapta birleştiriyoruz. (Google e-postayı doğruladığı için güvenli.)
      allowDangerousEmailAccountLinking: true
    })
  );
}

/** Google provider'ı (env doluysa) aktif mi — UI'da butonu koşullu göstermek için. */
export const googleAuthEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET ?? "development-fonly-auth-secret-change-me",
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.premiumCheckedAt = 0; // ilk girişte premium check zorla
      }

      const userId = token.id as string | undefined;
      if (userId) {
        const lastCheck = token.premiumCheckedAt ?? 0;
        if (Date.now() - lastCheck > PREMIUM_REFRESH_MS) {
          token.isPremium = await isPremium(userId);
          token.premiumCheckedAt = Date.now();
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.isPremium = token.isPremium === true;
      }

      return session;
    }
  }
});
