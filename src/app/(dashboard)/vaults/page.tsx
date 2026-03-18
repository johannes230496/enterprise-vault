import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Shield, Key, Lock, Users } from "lucide-react";
import { getEffectivePermissions } from "@/lib/authz";
import TresorErstellenModal from "@/components/TresorErstellenModal";
import { ensurePersonalVault } from "@/app/actions/personal-vault";

export default async function VaultsPage() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { groupMemberships: true }
  });

  if (!user) return null;

  // Ensure personal vault exists
  await ensurePersonalVault(user.id, user.organizationId as string);

  const isGlobalAdmin = user.globalRole === "OWNER" || user.globalRole === "SECURITY_ADMIN";
  const gruppenIds = user.groupMemberships.map((g: any) => g.groupId) || [];

  let allVisibleVaults;
  if (isGlobalAdmin) {
    allVisibleVaults = await prisma.vault.findMany({
      where: { organizationId: user.organizationId as string },
      include: { _count: { select: { secrets: true } } }
    });
  } else {
    const mitgliedschaften = await prisma.vaultMembership.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { groupId: { in: gruppenIds } }
        ]
      },
      include: {
        vault: {
          include: { _count: { select: { secrets: true } } }
        }
      }
    });

    const personalVaults = await prisma.vault.findMany({
      where: { userId: session.user.id, isPersonal: true },
      include: { _count: { select: { secrets: true } } }
    });

    const vaultMap = new Map();
    personalVaults.forEach(v => vaultMap.set(v.id, v));
    mitgliedschaften.forEach((m: any) => vaultMap.set(m.vaultId, m.vault));
    allVisibleVaults = Array.from(vaultMap.values());
  }

  const sharedVaults = allVisibleVaults.filter(v => !v.isPersonal);
  const personalVaults = allVisibleVaults.filter(v => v.isPersonal);

  const berechtigungsMap = await Promise.all(
    allVisibleVaults.map(async (v: any) => {
      const p = await getEffectivePermissions(session.user.id as string, v.id);
      return { vaultId: v.id, permissions: p };
    })
  );

  const VaultCard = ({ vault }: { vault: any }) => {
    const perms = berechtigungsMap.find((p: any) => p.vaultId === vault.id)?.permissions;
    return (
      <Link href={`/vaults/${vault.id}`} key={vault.id} className="block group">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm group-hover:border-indigo-500 group-hover:shadow-md transition-all h-full flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className={`${vault.isPersonal ? "bg-amber-100" : "bg-slate-100"} p-2 rounded-lg`}>
              {vault.isPersonal ? <Lock className="w-6 h-6 text-amber-700" /> : <Shield className="w-6 h-6 text-slate-700" />}
            </div>
            <div className="flex flex-col items-end gap-1">
              {vault.isPersonal && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                  Privat
                </span>
              )}
              {perms?.manage && !vault.isPersonal && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                  Verwalter
                </span>
              )}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{vault.name}</h3>
          <p className="text-sm text-gray-500 flex-grow mb-4 line-clamp-2">{vault.description}</p>
          
          <div className="border-t border-gray-100 pt-4 mt-auto">
            <div className="flex items-center text-sm font-medium text-gray-500 justify-between">
              <div className="flex items-center">
                <Key className="w-4 h-4 mr-1.5" />
                {vault._count.secrets} Geheimnisse
              </div>
              <div className="flex space-x-1">
                 {perms?.reveal && <span className="w-2 h-2 rounded-full bg-green-500" title="Anzeige-Zugriff" />}
                 {perms?.edit && <span className="w-2 h-2 rounded-full bg-blue-500" title="Bearbeitungs-Zugriff" />}
                 {(!perms?.reveal && !perms?.edit && perms?.use) && <span className="w-2 h-2 rounded-full bg-amber-500" title="Nur Verwenden" />}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Personal Vault Section */}
      <section>
        <div className="flex items-center mb-6">
          <div className="bg-amber-100 p-2 rounded-lg mr-4">
            <Lock className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dein privater Bereich</h2>
            <p className="text-sm text-gray-500">Nur du kannst diese Passwörter sehen – absolut privat.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personalVaults.map(v => <VaultCard key={v.id} vault={v} />)}
        </div>
      </section>

      {/* Shared Vaults Section */}
      <section>
        <div className="flex justify-between items-center mb-6 border-t border-gray-100 pt-10">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-lg mr-4">
              <Users className="w-6 h-6 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Team-Tresore</h2>
              <p className="text-sm text-gray-500">Gemeinsam genutzte Passwörter für dein Team oder die Organisation.</p>
            </div>
          </div>
          {user.globalRole === "OWNER" && <TresorErstellenModal />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sharedVaults.map(v => <VaultCard key={v.id} vault={v} />)}
          {sharedVaults.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
              <Shield className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Keine Team-Tresore vorhanden oder zugänglich.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
