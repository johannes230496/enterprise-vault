"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageVault, auditLog } from "@/lib/authz";
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

export async function addVaultMemberAction(
  vaultId: string,
  type: "user" | "group",
  memberId: string,
  permissions: { use: boolean; reveal: boolean; edit: boolean; manage: boolean; export: boolean }
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Nicht angemeldet");

  const canManage = await canManageVault(session.user.id as string, vaultId);
  if (!canManage) throw new Error("Keine Verwaltungsberechtigung für diesen Tresor.");

  await prisma.vaultMembership.create({
    data: {
      vaultId,
      userId: type === "user" ? memberId : null,
      groupId: type === "group" ? memberId : null,
      permissions: JSON.stringify(permissions),
    }
  });

  await auditLog(session.user.id, "VAULT_MANAGE", "VAULT", vaultId, { action: "ADD_MEMBER", type, memberId });
  revalidatePath(`/vaults/${vaultId}/members`);
}

export async function removeVaultMemberAction(membershipId: string, vaultId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Nicht angemeldet");

  const canManage = await canManageVault(session.user.id as string, vaultId);
  if (!canManage) throw new Error("Keine Verwaltungsberechtigung für diesen Tresor.");

  await prisma.vaultMembership.delete({ where: { id: membershipId } });

  await auditLog(session.user.id, "VAULT_MANAGE", "VAULT", vaultId, { action: "REMOVE_MEMBER", membershipId });
  revalidatePath(`/vaults/${vaultId}/members`);
}
