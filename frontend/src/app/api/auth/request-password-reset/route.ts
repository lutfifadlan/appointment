import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
  try {
      const body = await request.json()
      const { email } = body

      const response = await fetch(`${BACKEND_URL}/api/v1/auth/request-password-reset`, {
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