import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageVault } from "@/lib/authz";
import { notFound, redirect } from "next/navigation";
import { Shield, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import VaultMembersClient from "@/components/vaults/VaultMembersClient";

export default async function VaultMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const { id: vaultId } = await params;

  const vault = await prisma.vault.findUnique({ where: { id: vaultId } });
  if (!vault) notFound();

  const canManage = await canManageVault(session.user.id as string, vaultId);
  if (!canManage) redirect(`/vaults/${vaultId}`);

  const memberships = await prisma.vaultMembership.findMany({
    where: { vaultId },
    include: { user: true, group: true },
    orderBy: { createdAt: "asc" },
  });

  const allUsers = await prisma.user.findMany({
    where: { organizationId: vault.organizationId },
    orderBy: { name: "asc" },
  });

  const allGroups = await prisma.group.findMany({
    where: { organizationId: vault.organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <div className="flex items-center">
          <Shield className="w-7 h-7 text-indigo-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Zugriff verwalten</h1>
            <p className="text-sm text-gray-500 mt-0.5">{vault.name}</p>
          </div>
        </div>
        <Link
          href={`/vaults/${vaultId}`}
          className="flex items-center text-sm text-gray-600 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Zurück zum Tresor
        </Link>
      </div>

      <VaultMembersClient
        vaultId={vaultId}
        memberships={memberships.map((m: any) => ({
          id: m.id,
          type: m.groupId ? "group" : "user",
          name: m.group?.name ?? m.user?.name ?? m.user?.email ?? "Unbekannt",
          memberId: m.groupId ?? m.userId,
          permissions: JSON.parse(m.permissions),
        }))}
        availableUsers={allUsers.map((u: any) => ({ id: u.id, name: u.name ?? u.email }))}
        availableGroups={allGroups.map((g: any) => ({ id: g.id, name: g.name }))}
      />
    </div>
  );
}
