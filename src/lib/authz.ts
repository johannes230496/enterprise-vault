import { prisma } from "@/lib/prisma";

export type ActionType = 
  | "SECRET_REVEAL"
  | "SECRET_CREATE"
  | "SECRET_UPDATE"
  | "SECRET_DELETE"
  | "VAULT_CREATE"
  | "VAULT_MANAGE"
  | "GROUP_MANAGE";

export type TargetType = "SECRET" | "VAULT" | "USER" | "GROUP" | "ORG";

export interface PermissionSet {
  use: boolean;
  reveal: boolean;
  edit: boolean;
  delete: boolean;
  share: boolean;
  export: boolean;
  manage: boolean;
}

export const defaultDeny: PermissionSet = {
  use: false,
  reveal: false,
  edit: false,
  delete: false,
  share: false,
  export: false,
  manage: false
};

/**
 * Audit an action in the database
 */
export async function auditLog(
  actorId: string | null,
  action: ActionType,
  targetType: TargetType,
  targetId: string,
  metadata?: any,
  ipAddress?: string,
  userAgent?: string
) {
  await prisma.auditEvent.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent
    }
  });
}

/**
 * Calculates effective permissions for a user on a given vault.
 * Priority: 
 * 1. Global Role (Owner has full access)
 * 2. Direct user override (if exists)
 * 3. Union of Group permissions
 */
export async function getEffectivePermissions(userId: string, vaultId: string): Promise<PermissionSet> {
  // 1. Fetch Vault and check Personal status
  const vault = await prisma.vault.findUnique({
    where: { id: vaultId },
    select: { isPersonal: true, userId: true }
  });

  if (!vault) return { ...defaultDeny };

  // 1. Check Global Role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalRole: true, groupMemberships: { select: { groupId: true } } }
  });

  if (!user) return { ...defaultDeny };

  // Personal Vault Logic: Owner (Admin) does NOT get access by default
  const isVaultOwner = vault.isPersonal && vault.userId === userId;

  if (user.globalRole === "OWNER" && !vault.isPersonal) {
    return {
      use: true,
      reveal: true,
      edit: true,
      delete: true,
      share: true,
      export: true,
      manage: true
    };
  }

  // If it's a personal vault, give the specific owner full access
  if (isVaultOwner) {
    return {
      use: true,
      reveal: true,
      edit: true,
      delete: true,
      share: true,
      export: false, // Usually personal vaults shouldn't be exported as easily
      manage: true
    };
  }

  // Security Admin can manage but NOT necessarily reveal unless granted
  let basePermissions = { ...defaultDeny };
  if (user.globalRole === "SECURITY_ADMIN") {
    // Only management, no payload access by default
    basePermissions.manage = true;
  }

  // 2. Fetch Vault Memberships mapping to this user's groups or directly
  const groupIds = user.groupMemberships.map((g: { groupId: string }) => g.groupId);
  
  const memberships = await prisma.vaultMembership.findMany({
    where: {
      vaultId,
      OR: [
        { userId: userId },
        { groupId: { in: groupIds } }
      ]
    }
  });

  // 3. Union Strategy (Grant if ANY membership allows it)
  // Note: Direct user assignment overrides could be implemented as priority, 
  // but for simple RBAC, a union is common unless explicit DENY constructs are needed.
  let effective = { ...basePermissions };

  for (const ms of memberships) {
    const p = JSON.parse(ms.permissions as string) as Partial<PermissionSet>;
    if (p.use) effective.use = true;
    if (p.reveal) effective.reveal = true;
    if (p.edit) effective.edit = true;
    if (p.delete) effective.delete = true;
    if (p.share) effective.share = true;
    if (p.export) effective.export = true;
    if (p.manage) effective.manage = true;
  }

  return effective;
}

/**
 * Evaluates whether a user can perform a specific capability on a secret.
 */
export async function canAccessSecret(userId: string, secretId: string, capability: keyof PermissionSet): Promise<boolean> {
  const secret = await prisma.secret.findUnique({
    where: { id: secretId },
    select: { vaultId: true }
  });

  if (!secret) return false;

  const perms = await getEffectivePermissions(userId, secret.vaultId);
  return !!perms[capability];
}

/**
 * Helper specifically for Vault Management checks
 */
export async function canManageVault(userId: string, vaultId: string): Promise<boolean> {
  const perms = await getEffectivePermissions(userId, vaultId);
  return perms.manage;
}
