"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/authz";
import { revalidatePath } from "next/cache";

export async function deleteUserAction(userId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Nicht angemeldet");

  const actor = await prisma.user.findUnique({ where: { id: session.user.id as string } });
  if (actor?.globalRole !== "OWNER") throw new Error("Keine Berechtigung.");
  if (userId === session.user.id) throw new Error("Sie können sich nicht selbst löschen.");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Benutzer nicht gefunden.");
  if (target.globalRole === "OWNER") throw new Error("Eigentümer können nicht gelöscht werden.");

  // Delete in order to satisfy FK constraints
  await prisma.secretVersion.deleteMany({ where: { createdById: userId } });
  await prisma.secret.deleteMany({ where: { createdById: userId } });
  await prisma.user.delete({ where: { id: userId } });

  await auditLog(session.user.id, "VAULT_MANAGE", "USER", userId, { action: "DELETE_USER", email: target.email });
  revalidatePath("/settings");
}
