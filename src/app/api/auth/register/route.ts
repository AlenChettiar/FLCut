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
