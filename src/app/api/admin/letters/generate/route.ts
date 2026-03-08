import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateLetterPdf } from "@/lib/letter-pdf";

const schema = z.object({
  clientId: z.string(),
  letterType: z.enum(["bureau", "mov", "creditor", "cfpb"]),
  negativeItemIds: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { id: body.clientId },
    include: {
      user: { select: { name: true, email: true } },
      negativeItems: body.negativeItemIds.length
        ? { where: { id: { in: body.negativeItemIds } } }
        : true,
    },
  });
  if (!profile) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const items = body.negativeItemIds.length
    ? profile.negativeItems
    : profile.negativeItems.slice(0, 10);

  const pdfPath = await generateLetterPdf({
    letterType: body.letterType,
    clientName: profile.user.name ?? profile.user.email,
    clientAddress: " [Address on file]",
    negativeItems: items.map((i) => ({
      accountName: i.accountName,
      bureau: i.bureau,
      negativeReason: i.negativeReason ?? "",
    })),
  });

  if (!pdfPath) {
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }

  const pdfUrl = `/api/documents/download?path=${encodeURIComponent(pdfPath)}`;
  return NextResponse.json({ pdfUrl, path: pdfPath });
}
