export default defineEventHandler(async (event) => {
  // Clear the auth token cookie
  setCookie(event, 'auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0 // Immediately expire the cookie
  })

  // Clear the user cookie as well
  setCookie(event, 'auth-user', '', {
    maxAge: 0 // Immediately expire the cookie
  })

  return { message: 'Logged out successfully' }
})
