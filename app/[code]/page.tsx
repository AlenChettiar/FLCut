import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/db";


interface RedirectPageProps {
  params: Promise<{ code: string }>;
}

// 2. Make the function async so we can interact with the cloud database
export default async function RedirectPage({ params }: RedirectPageProps) {
  // 3. Unpack the parameters safely
  const { code } = await params;

 
  const linkRecord = await prisma.shortLink.findUnique({
    where: {
      shortCode: code,
    },
  });

  
  if (!linkRecord) {
    notFound(); 
  }

  
  await prisma.shortLink.update({
    where: { id: linkRecord.id },
    data: { currentClicks: { increment: 1 } },
  });


  redirect(linkRecord.originalUrl);
}
