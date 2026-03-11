"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function tresorErstellenAction(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Nicht angemeldet");

  const user = await prisma.user.findUnique({ where: { id: session.user.id as string } });
  if (user?.globalRole !== "OWNER") throw new Error("Keine Berechtigung");

  const name = formData.get("name") as string;
  const beschreibung = formData.get("beschreibung") as string;

  if (!name?.trim()) throw new Error("Name ist erforderlich");

  const neuerTresor = await prisma.vault.create({
    data: {
      name: name.trim(),
      description: beschreibung?.trim() || null,
      organizationId: user.organizationId as string,
    }
  });

  revalidatePath("/vaults");
  redirect(`/vaults/${neuerTresor.id}`);
}
