import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || "your-super-secret-jwt-key-here";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
}

export async function verifyAuth(
  request: NextRequest
): Promise<{ user: AuthUser | null; error: NextResponse | null }> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "No token provided" },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      return {
        user: {
          userId: decoded.userId,
          email: decoded.email,
          name: decoded.name,
        },
        error: null,
      };
    } catch (jwtError) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        ),
      };
    }
  } catch (error) {
    console.error("Auth verification error:", error);
    return {
      user: null,
      error: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
    };
  }
}
