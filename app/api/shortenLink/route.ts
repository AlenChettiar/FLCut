import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";

const base62Alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const createSecureNanoId = customAlphabet(base62Alphabet, 7); 

export async function POST(request: NextRequest) {
  try {
    const { link } = await request.json();

    
    if (!link) {
      return NextResponse.json({ error: "URL field is required" }, { status: 400 });
    }

   
    const generatedCode = createSecureNanoId();

    
    const databaseRecord = await prisma.shortLink.create({
      data: {
        originalUrl: link,
        shortCode: generatedCode, 
      },
    });

    
    return NextResponse.json({ shortCode: databaseRecord.shortCode }, { status: 201 });

  } catch (error) {
    console.error("Database save failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}