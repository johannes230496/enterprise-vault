import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShieldAlert, Key, Lock, Users } from "lucide-react";
import Link from "next/link";

export default async function DashboardHome() {
  const session = await getSession();
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: {
      groupMemberships: true,
    }
  });

  const gruppenAnzahl = user?.groupMemberships.length || 0;
  
  const gruppenIds = user?.groupMemberships.map(g => g.groupId) || [];
  const tresorZugriff = await prisma.vaultMembership.findMany({
    where: {
      OR: [
        { userId: session?.user?.id },
        { groupId: { in: gruppenIds } }
      ]
    },
    include: { vault: true }
  });

  const eindeutigeTresore = Array.from(new Set(tresorZugriff.map(v => v.vault.id)));

  let gesamtbenutzer = 0;
  if (user?.globalRole === "OWNER" || user?.globalRole === "SECURITY_ADMIN") {
    gesamtbenutzer = await prisma.user.count({ where: { organizationId: user.organizationId } });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Willkommen zurück, {session?.user?.name}</h2>
        <p className="text-gray-500">Ihr Zugriff auf Unternehmensgeheimnisse wird über Ihre Gruppenmitgliedschaften verwaltet.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-start">
          <div className="bg-indigo-100 p-3 rounded-md mr-4">
            <Key className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Zugängliche Tresore</p>
            <p className="text-2xl font-semibold text-gray-900">{eindeutigeTresore.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-start">
          <div className="bg-blue-100 p-3 rounded-md mr-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Meine Gruppen</p>
            <p className="text-2xl font-semibold text-gray-900">{gruppenAnzahl}</p>
          </div>
        </div>

        {gesamtbenutzer > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-start">
            <div className="bg-emerald-100 p-3 rounded-md mr-4">
              <ShieldAlert className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Org.-Benutzer gesamt</p>
              <p className="text-2xl font-semibold text-gray-900">{gesamtbenutzer}</p>
            </div>
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Schnellzugriff</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/vaults" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all">
          <Lock className="w-6 h-6 text-indigo-500 mb-2" />
          <h4 className="font-medium text-gray-900">Geheimnisse durchsuchen</h4>
          <p className="text-sm text-gray-500 mt-1">Passwörter anzeigen, auf die Sie Zugriff haben.</p>
        </Link>
        <Link href="/groups" className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
          <Users className="w-6 h-6 text-blue-500 mb-2" />
          <h4 className="font-medium text-gray-900">Mein Zugriff</h4>
          <p className="text-sm text-gray-500 mt-1">Sehen Sie, welche Gruppen Ihnen Berechtigungen erteilen.</p>
        </Link>
      </div>
      
    </div>
  );
}
