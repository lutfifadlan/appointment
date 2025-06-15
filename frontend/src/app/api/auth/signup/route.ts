import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { name, email, password } = body;

    console.log(process.env.BACKEND_API_URL);

    const response = await fetch(`${process.env.BACKEND_API_URL}/auth/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
}
    