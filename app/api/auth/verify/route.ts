import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || "your-super-secret-jwt-key-here";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      return NextResponse.json(
        {
          valid: true,
          user: {
            id: decoded.userId,
            email: decoded.email,
            name: decoded.name,
          },
        },
        { status: 200 }
      );
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
