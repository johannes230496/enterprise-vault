import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users as UsersIcon, Shield } from "lucide-react";
import GruppeErstellenModal from "@/components/groups/GruppeErstellenModal";
import Link from "next/link";

export default async function GruppenSeite() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      groupMemberships: {
        include: {
          group: {
            include: {
              vaultMemberships: {
                include: { vault: true }
              },
              _count: { select: { members: true } }
            }
          }
        }
      }
    }
  });

  const isGlobalAdmin = user?.globalRole === "OWNER" || user?.globalRole === "SECURITY_ADMIN";
  
  let alleGruppen: any[] = [];
  if (isGlobalAdmin) {
    alleGruppen = await prisma.group.findMany({
      where: { organizationId: user?.organizationId as string },
      include: {
        vaultMemberships: { include: { vault: true } },
        _count: { select: { members: true } }
      }
    });
  }

  const meineGruppen = user?.groupMemberships.map((m: any) => m.group) || [];
  const anzeigeGruppen = isGlobalAdmin ? alleGruppen : meineGruppen;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <UsersIcon className="w-8 h-8 text-indigo-600 mr-3" />
            Gruppen & Zugriff
          </h2>
          <p className="text-gray-500 mt-1">Zugriff sollte über Gruppen und nicht über einzelne Benutzer gewährt werden.</p>
        </div>
        {user?.globalRole === "OWNER" && <GruppeErstellenModal />}
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {anzeigeGruppen.map((group: any) => (
            <li key={group.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                  <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <UsersIcon className="w-4 h-4 mr-1" />
                      {group._count?.members || 0} Mitglieder
                    </span>
                    <span className="flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      {group.vaultMemberships.length} verbundene Tresore
                    </span>
                  </div>
                </div>
                {isGlobalAdmin && (
                  <Link 
                    href={`/groups/${group.id}`}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Verwalten
                  </Link>
                )}
              </div>

              {group.vaultMemberships.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Gewährte Berechtigungen</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.vaultMemberships.map((vm: any) => {
                      const p = JSON.parse(vm.permissions as string);
                      return (
                        <div key={vm.id} className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm">
                          <span className="text-gray-700 font-medium mr-2">{vm.vault.name}:</span>
                          <div className="flex space-x-1.5 font-mono text-xs text-gray-500">
                             {p.manage && <span className="text-indigo-600 font-bold" title="Mitglieder verwalten">V</span>}
                             {p.reveal && <span className="text-green-600 font-bold" title="Geheimnisse anzeigen">A</span>}
                             {p.edit && <span className="text-blue-600 font-bold" title="Geheimnisse bearbeiten">B</span>}
                             {p.use && !p.reveal && !p.edit && <span className="text-amber-600 font-bold" title="Nur Verwenden">U</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {anzeigeGruppen.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            Sie sind noch kein Mitglied einer Gruppe.
          </div>
        )}
      </div>
    </div>
  );
}
