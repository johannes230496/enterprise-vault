"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog, canAccessSecret, canManageVault, getEffectivePermissions } from "@/lib/authz";
import { revalidatePath } from "next/cache";

export async function revealSecretAction(secretId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const canReveal = await canAccessSecret(session.user.id as string, secretId, "reveal");
  
  if (!canReveal) {
    // Log unauthorized attempt
    await auditLog(
      session.user.id as string,
      "SECRET_REVEAL",
      "SECRET",
      secretId,
      { status: "DENIED", reason: "Missing 'reveal' permission" }
    );
    throw new Error("You do not have permission to reveal this secret.");
  }

  const secret = await prisma.secret.findUnique({ where: { id: secretId } });
  if (!secret) throw new Error("Not found");

  // Log successful reveal
  await auditLog(
    session.user.id as string,
    "SECRET_REVEAL",
    "SECRET",
    secretId,
    { status: "GRANTED" }
  );

  return {
    encryptedData: secret.encryptedData,
    iv: secret.iv,
    authTag: secret.authTag
  };
}

export async function createSecretAction(
  vaultId: string, 
  name: string, 
  contentType: string, 
  encryptedData: string, 
  iv: string, 
  authTag: string
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Nicht authentifiziert");

  const canEdit = await canAccessSecret(session.user.id as string, "", "edit"); // Check general edit permission or vault-specific
  // More robust check:
  const perms = await getEffectivePermissions(session.user.id as string, vaultId);
  if (!perms.edit) throw new Error("Keine Berechtigung zum Erstellen von Geheimnissen in diesem Tresor.");

  const secret = await prisma.secret.create({
    data: {
      vaultId,
      name,
      contentType,
      encryptedData,
      iv,
      authTag,
      createdById: session.user.id,
    }
  });

  await auditLog(session.user.id, "SECRET_CREATE", "SECRET", secret.id, { name });
  revalidatePath(`/vaults/${vaultId}`);
  return secret;
}

export async function getVaultMembershipsAction(vaultId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const isManager = await canManageVault(session.user.id as string, vaultId);
  const user = await prisma.user.findUnique({ where: { id: session.user.id as string } });
  
  if (!isManager && user?.globalRole !== "OWNER") {
    throw new Error("Missing 'manage' permission for this vault.");
  }

  const memberships = await prisma.vaultMembership.findMany({
    where: { vaultId },
    include: {
      group: true,
      user: true
    }
  });

  return memberships;
}
