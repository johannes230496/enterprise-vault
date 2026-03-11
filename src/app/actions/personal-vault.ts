"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function ensurePersonalVault(userId: string, organizationId: string) {
  const existing = await prisma.vault.findFirst({
    where: {
      userId,
      isPersonal: true
    }
  });

  if (existing) return existing;

  const newVault = await prisma.vault.create({
    data: {
      name: "Persönlicher Tresor",
      description: "Nur für deine privaten Passwörter. Niemand sonst hat Zugriff.",
      isPersonal: true,
      userId,
      organizationId
    }
  });

  return newVault;
}
