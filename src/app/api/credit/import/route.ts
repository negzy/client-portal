import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { CreditProvider } from "@prisma/client";

const schema = z.object({
  provider: z.enum([
    "MyFreeScoreNow",
    "IdentityIQ",
    "SmartCredit",
    "MyScoreIQ",
  ]),
  username: z.string().optional(),
  password: z.string().optional(),
  securityWord: z.string().optional(),
  last4SSN: z.string().max(4).optional(),
  phone: z.string().optional(),
  auditTemplateId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Store import attempt. In production, credentials would be encrypted and
  // a background job would call the provider API. For MVP we don't have provider APIs.
  const creditImport = await prisma.creditImport.create({
    data: {
      clientProfileId: profile.id,
      provider: body.provider as CreditProvider,
      username: body.username ?? null,
      passwordEnc: body.password ?? null, // TODO: encrypt in production
      securityWord: body.securityWord ?? null,
      last4SSN: body.last4SSN ?? null,
      phone: body.phone ?? null,
      auditTemplateId: body.auditTemplateId ?? null,
      status: "pending",
    },
  });

  // MVP: No direct provider integration. Return success and suggest manual upload
  // so the client can still get an audit via PDF/screenshot upload.
  return NextResponse.json({
    importId: creditImport.id,
    message:
      "Import request received. If automatic import is not available, please use Manual Upload to submit your credit report PDF or screenshots.",
    auditId: null as string | null,
  });
}
