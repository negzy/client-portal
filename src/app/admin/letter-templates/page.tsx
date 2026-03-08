import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LetterTemplateManager } from "@/components/admin/LetterTemplateManager";

const CATEGORIES = [
  "bureau_dispute",
  "mov",
  "creditor",
  "cfpb",
  "collection",
  "inquiry_removal",
  "custom",
];

export default async function AdminLetterTemplatesPage() {
  await getServerSession(authOptions);

  const templates = await prisma.letterTemplate.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Letter templates</h1>
        <p className="page-sub">
          Upload and manage dispute letter templates. Use these in the Letter Generator.
        </p>
      </div>

      <LetterTemplateManager templates={templates} categories={CATEGORIES} />
    </div>
  );
}
