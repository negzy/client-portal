import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeUserEmail } from "@/lib/user-email";
import { z } from "zod";

const schema = z.object({
  clientProfileId: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  dateOfBirth: z.string().optional(),
  businessName: z.string().optional(),
  businessEntityType: z.string().optional(),
  llcState: z.string().optional(),
  ein: z.string().optional(),
  preferredContactMethod: z.string().optional(),
  creditMonitoringEmail: z.string().optional().nullable(),
  creditMonitoringUsername: z.string().optional().nullable(),
  creditMonitoringNotes: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      creditMonitoringEmail: true,
      creditMonitoringUsername: true,
      creditMonitoringNotes: true,
    },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = (session.user as { role?: string }).role === "ADMIN";
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError
      ? err.errors.map((e) => e.message).join(". ")
      : "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { id: body.clientProfileId },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!isAdmin && profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.firstName !== undefined) updateData.firstName = body.firstName;
  if (body.lastName !== undefined) updateData.lastName = body.lastName;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.address !== undefined) updateData.address = body.address;
  if (body.city !== undefined) updateData.city = body.city;
  if (body.state !== undefined) updateData.state = body.state;
  if (body.zip !== undefined) updateData.zip = body.zip;
  if (body.dateOfBirth !== undefined)
    updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  if (body.businessName !== undefined) updateData.businessName = body.businessName;
  if (body.businessEntityType !== undefined) updateData.businessEntityType = body.businessEntityType;
  if (body.llcState !== undefined) updateData.llcState = body.llcState;
  if (body.ein !== undefined) updateData.ein = body.ein;
  if (body.preferredContactMethod !== undefined)
    updateData.preferredContactMethod = body.preferredContactMethod;
  if (body.creditMonitoringEmail !== undefined)
    updateData.creditMonitoringEmail = body.creditMonitoringEmail;
  if (body.creditMonitoringUsername !== undefined)
    updateData.creditMonitoringUsername = body.creditMonitoringUsername;
  if (body.creditMonitoringNotes !== undefined)
    updateData.creditMonitoringNotes = body.creditMonitoringNotes;

  await prisma.clientProfile.update({
    where: { id: body.clientProfileId },
    data: updateData,
  });

  if (body.email !== undefined && (isAdmin || profile.userId === session.user.id)) {
    const nextEmail = normalizeUserEmail(body.email);
    const taken = await prisma.user.findFirst({
      where: { email: nextEmail, NOT: { id: profile.userId } },
    });
    if (taken) {
      return NextResponse.json(
        { error: "That email is already in use" },
        { status: 400 }
      );
    }
    await prisma.user.update({
      where: { id: profile.userId },
      data: { email: nextEmail },
    });
  }

  if (body.firstName !== undefined || body.lastName !== undefined) {
    const name = [body.firstName ?? profile.firstName, body.lastName ?? profile.lastName]
      .filter(Boolean)
      .join(" ");
    if (name) {
      await prisma.user.update({
        where: { id: profile.userId },
        data: { name },
      });
    }
  }

  return NextResponse.json({ success: true });
}
