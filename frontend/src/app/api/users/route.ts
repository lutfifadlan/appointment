import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get("jc_token")?.value;
    const body = await request.json();
    const { name, email, password } = body;

    const response = await fetch(`${process.env.BACKEND_API_URL}/users`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
}
