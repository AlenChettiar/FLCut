import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcrypt-ts"
import prisma from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user) {
          return null 
        }

        const isPasswordValid = await compare(
          credentials.password as string, 
          user.password
        )

        if (!isPasswordValid) {
          return null 
        }


        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  callbacks: {
    // Inject the user's ID into the JWT token 
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    // Pass the ID from the token down to the active session object
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})
