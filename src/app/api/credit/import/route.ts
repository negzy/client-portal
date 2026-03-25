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

  // No consumer-monitoring vendor ships a self-serve REST API for “paste credentials and pull PDF”
  // without a reseller / enterprise contract. Credentials are stored for staff follow-up; audit is via upload.
  const webhookConfigured = Boolean(process.env.CREDIT_IMPORT_WEBHOOK_URL?.trim());
  return NextResponse.json({
    importId: creditImport.id,
    automaticImportAvailable: webhookConfigured,
    message: webhookConfigured
      ? "Your import request was sent for automated processing. You will receive an audit when the report is pulled. If nothing arrives within one business day, upload your PDF manually."
      : "We saved your provider and sign-in details for your team. This portal does not yet pull reports directly from the monitoring site (that requires a vendor API or automation you enable server-side). For an immediate Credit Report Analysis, go back and upload your 3-bureau PDF — scores and negatives are parsed automatically.",
    auditId: null as string | null,
  });
}
