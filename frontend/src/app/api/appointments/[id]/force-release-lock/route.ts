import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const id = (await params).id;
    const response = await fetch(
      `${process.env.BACKEND_URL}/appointments/${id}/force-release-lock`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to force release lock:', error);
    return NextResponse.json(
      { error: 'Failed to force release lock' },
      { status: 500 }
    );
  }
} 