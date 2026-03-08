import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BankMatrixManager } from "@/components/admin/BankMatrixManager";

export default async function AdminBankMatrixPage() {
  await getServerSession(authOptions);

  const products = await prisma.bankProduct.findMany({
    orderBy: [{ bankName: "asc" }, { productName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bank / Product matrix</h1>
        <p className="mt-1 text-slate-400">
          Banks and products for capital access mapping
        </p>
      </div>
      <BankMatrixManager products={products} />
    </div>
  );
}
