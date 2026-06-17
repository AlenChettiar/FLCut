import { NextResponse } from "next/server";
import { genSalt, hash } from "bcrypt-ts";
import prisma from "@/lib/db"; 
export async function POST(req: Request) {
  try {

    const body = await req.json();
    const { email, password, name } = body;
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Email format validation (RFC-5322 subset — same pattern used by browsers)
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(String(email).toLowerCase())) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Password complexity validation
    const passwordErrors: string[] = [];
    if (password.length < 8)                    passwordErrors.push("at least 8 characters");
    if (!/[A-Z]/.test(password))                passwordErrors.push("one uppercase letter");
    if (!/[a-z]/.test(password))                passwordErrors.push("one lowercase letter");
    if (!/[0-9]/.test(password))                passwordErrors.push("one number");
    if (!/[^A-Za-z0-9]/.test(password))         passwordErrors.push("one special character");

    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: `Password must contain: ${passwordErrors.join(", ")}.` },
        { status: 400 }
      );
    }
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }
    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name?.trim() || null,
      },
    });
    return NextResponse.json(
      { 
        message: "User registered successfully!", 
        user: { id: newUser.id, email: newUser.email } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
