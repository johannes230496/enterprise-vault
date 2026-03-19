"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/authz";

export async function createGroup(name: string) {
  const session = await getSession();
  
  if (!session?.user?.id) {
    throw new Error("Nicht authentifiziert");
  }

  // Berechtigungsprüfung: Nur OWNER und SECURITY_ADMIN dürfen Gruppen erstellen
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true, organizationId: true }
  });

  if (!user || (user.globalRole !== "OWNER" && user.globalRole !== "SECURITY_ADMIN")) {
    throw new Error("Nicht autorisiert: Nur Administratoren können Gruppen erstellen");
  }

  if (!user.organizationId) {
    throw new Error("Benutzer ist keiner Organisation zugeordnet");
  }

  if (!name || name.trim().length === 0) {
    throw new Error("Gruppenname darf nicht leer sein");
  }

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      organizationId: user.organizationId,
    }
  });

  // Audit Log
  await auditLog(
    session.user.id,
    "GROUP_MANAGE",
    "GROUP",
    group.id,
    { action: "CREATE", name: group.name }
  );

  revalidatePath("/groups");
  return group;
}

export async function updateGroup(groupId: string, name: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Nicht authentifiziert");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true, organizationId: true }
  });

  if (!user || (user.globalRole !== "OWNER" && user.globalRole !== "SECURITY_ADMIN")) {
    throw new Error("Nicht autorisiert");
  }

  // Sicherstellen, dass die Gruppe zur eigenen Organisation gehört
  const existing = await prisma.group.findUnique({ where: { id: groupId }, select: { organizationId: true } });
  if (!existing || existing.organizationId !== user.organizationId) throw new Error("Gruppe nicht gefunden");

  const group = await prisma.group.update({
    where: { id: groupId },
    data: { name: name.trim() }
  });

  await auditLog(session.user.id, "GROUP_MANAGE", "GROUP", groupId, { action: "UPDATE", name: group.name });
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  return group;
}

export async function deleteGroup(groupId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Nicht authentifiziert");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true, organizationId: true }
  });

  if (!user || user.globalRole !== "OWNER") {
    throw new Error("Nur Besitzer können Gruppen löschen");
  }

  // Sicherstellen, dass die Gruppe zur eigenen Organisation gehört
  const existing = await prisma.group.findUnique({ where: { id: groupId }, select: { organizationId: true } });
  if (!existing || existing.organizationId !== user.organizationId) throw new Error("Gruppe nicht gefunden");

  await prisma.group.delete({ where: { id: groupId } });
  await auditLog(session.user.id, "GROUP_MANAGE", "GROUP", groupId, { action: "DELETE" });
  
  revalidatePath("/groups");
}

export async function addGroupMember(groupId: string, userId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Nicht authentifiziert");

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true, organizationId: true }
  });

  if (!admin || (admin.globalRole !== "OWNER" && admin.globalRole !== "SECURITY_ADMIN")) {
    throw new Error("Nicht autorisiert");
  }

  // Gruppe und Ziel-User müssen zur selben Organisation gehören
  const [group, targetUser] = await Promise.all([
    prisma.group.findUnique({ where: { id: groupId }, select: { organizationId: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } }),
  ]);
  if (!group || group.organizationId !== admin.organizationId) throw new Error("Gruppe nicht gefunden");
  if (!targetUser || targetUser.organizationId !== admin.organizationId) throw new Error("Benutzer nicht gefunden");

  const membership = await prisma.groupMembership.create({
    data: { groupId, userId }
  });

  await auditLog(session.user.id, "GROUP_MANAGE", "GROUP", groupId, { action: "ADD_MEMBER", memberId: userId });
  revalidatePath(`/groups/${groupId}`);
  return membership;
}

export async function removeGroupMember(groupId: string, userId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Nicht authentifiziert");

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true, organizationId: true }
  });

  if (!admin || (admin.globalRole !== "OWNER" && admin.globalRole !== "SECURITY_ADMIN")) {
    throw new Error("Nicht autorisiert");
  }

  // Gruppe muss zur eigenen Organisation gehören
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { organizationId: true } });
  if (!group || group.organizationId !== admin.organizationId) throw new Error("Gruppe nicht gefunden");

  await prisma.groupMembership.delete({
    where: { userId_groupId: { userId, groupId } }
  });

  await auditLog(session.user.id, "GROUP_MANAGE", "GROUP", groupId, { action: "REMOVE_MEMBER", memberId: userId });
  revalidatePath(`/groups/${groupId}`);
}

export async function gruppeVaultZuweisenAction(groupId: string, vaultId: string, permissions: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Nicht authentifiziert" };

  const actor = await prisma.user.findUnique({ where: { id: session.user.id as string } });
  if (!actor || !["OWNER", "SECURITY_ADMIN"].includes(actor.globalRole)) {
    return { error: "Keine Berechtigung" };
  }

  // Verify vault belongs to same org
  const vault = await prisma.vault.findUnique({ where: { id: vaultId } });
  if (!vault || vault.organizationId !== actor.organizationId) return { error: "Tresor nicht gefunden" };

  // Check not already assigned
  const existing = await prisma.vaultMembership.findFirst({ where: { groupId, vaultId } });
  if (existing) return { error: "Gruppe hat bereits Zugriff auf diesen Tresor" };

  await prisma.vaultMembership.create({
    data: { vaultId, groupId, permissions },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

export async function gruppeVaultEntfernenAction(membershipId: string, groupId: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Nicht authentifiziert" };

  const actor = await prisma.user.findUnique({ where: { id: session.user.id as string } });
  if (!actor || !["OWNER", "SECURITY_ADMIN"].includes(actor.globalRole)) {
    return { error: "Keine Berechtigung" };
  }

  await prisma.vaultMembership.delete({ where: { id: membershipId } });
  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
