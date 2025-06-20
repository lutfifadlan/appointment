import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { token, new_password } = body

        const response = await fetch(`${process.env.BACKEND_API_URL}/auth/reset-password?token=${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ new_password }),
        })

        if (!response.ok) {
            throw new Error('Failed to reset password')
        }

        return NextResponse.json({ message: 'Password reset successfully' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
    }
}