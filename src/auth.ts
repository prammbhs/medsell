import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const userArr = await db.select().from(users).where(eq(users.email, credentials.email as string))
        const user = userArr[0]

        if (!user) return null

        const passwordsMatch = await bcrypt.compare(credentials.password as string, user.passwordHash)

        if (passwordsMatch) {
          return { id: user.id, email: user.email, role: user.role }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.sub as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
})
