import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
      const body = await request.json()
      const { email } = body

      const response = await fetch(`${process.env.BACKEND_API_URL}/auth/request-password-reset`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
      })

      if (!response.ok) {
          throw new Error('Failed to send reset password email')
      }

      return NextResponse.json({ message: 'Reset password email sent successfully' })
  } catch (error) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to send reset password email' }, { status: 500 })
  }
}