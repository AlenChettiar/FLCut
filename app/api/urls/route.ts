import prisma from "@/lib/db"
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try{
        const urls=await prisma.shortLink.findMany({
            orderBy: {createdAt:'desc'},
            
        });

        return NextResponse.json(urls)

    }
    catch(error){
        console.error('Error fetching URLs',error);
        return NextResponse.json({error:'internal server error'}, {status : 500} )

    }
    
}