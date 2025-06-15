import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("jc_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    await fetch(`${process.env.BACKEND_API_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Create the response object
    const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    // Properly clear the cookie on the response
    response.cookies.set('jc_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      expires: new Date(0),
      domain: process.env.NODE_ENV === 'production' ? "lutfifadlan.com" : "localhost",
    });
    return response;
  } catch (error: unknown) {
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error(errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}