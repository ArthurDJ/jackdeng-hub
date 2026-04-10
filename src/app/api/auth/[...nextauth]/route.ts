import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // 白名单限制：仅允许您的官方邮箱登录或注册
      const allowedEmail = 'dj3013158@gmail.com'
      if (user.email === allowedEmail) {
        return true
      }
      console.warn(`[Auth Denied] Unauthorized login attempt from: ${user.email}`)
      return false
    },
    async session({ session, token }) {
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
