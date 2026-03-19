import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Activity, Filter } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default async function AuditProtokollSeite({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  const isGlobalAdmin = user?.globalRole === "OWNER" || user?.globalRole === "SECURITY_ADMIN";
  if (!isGlobalAdmin) {
    return (
      <div className="p-8 text-center text-red-600">
        Sie müssen Eigentümer oder Sicherheitsadministrator sein, um das globale Audit-Protokoll einzusehen.
      </div>
    );
  }

  const zielartFilter = searchParams?.type || undefined;
  
  const ereignisse = await prisma.auditEvent.findMany({
    where: {
      targetType: zielartFilter || undefined,
      actor: { organizationId: user?.organizationId as string },
    },
    orderBy: { timestamp: 'desc' },
    take: 50,
    include: {
      actor: { select: { name: true, email: true } }
    }
  });

  const getAktionsfarbe = (action: string) => {
    if (action.includes("REVEAL")) return "bg-blue-100 text-blue-800";
    if (action.includes("CREATE")) return "bg-green-100 text-green-800";
    if (action.includes("DELETE")) return "bg-red-100 text-red-800";
    if (action.includes("MANAGE")) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  const aktionsLabel: Record<string, string> = {
    SECRET_REVEAL: "Geheimnis angezeigt",
    SECRET_CREATE: "Geheimnis erstellt",
    SECRET_UPDATE: "Geheimnis bearbeitet",
    SECRET_DELETE: "Geheimnis gelöscht",
    VAULT_CREATE: "Tresor erstellt",
    VAULT_UPDATE: "Tresor bearbeitet",
    VAULT_DELETE: "Tresor gelöscht",
    VAULT_MANAGE: "Tresor verwaltet",
    GROUP_MANAGE: "Gruppe verwaltet",
    USER_DELETE: "Benutzer gelöscht",
    USER_INVITE: "Benutzer eingeladen",
  };

  const getKontextZusammenfassung = (metadata: string | null): string => {
    if (!metadata) return "-";
    try {
      const obj = JSON.parse(metadata as string);
      if (obj.name) return obj.name;
      if (obj.action && obj.memberId) return `${obj.action} (${String(obj.memberId).substring(0, 8)}…)`;
      const raw = JSON.stringify(obj);
      return raw.length > 60 ? raw.substring(0, 60) + "…" : raw;
    } catch {
      return String(metadata).substring(0, 60);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="w-8 h-8 text-indigo-600 mr-3" />
            Globales Audit-Protokoll
          </h2>
          <p className="text-gray-500 mt-1">Unveränderliche Aufzeichnung aller Zugriffs- und Änderungsereignisse.</p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center space-x-4">
          <div className="flex items-center text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4 mr-2" /> Filter:
          </div>
          <div className="flex space-x-2">
            <a href="/audit" className={`px-3 py-1 rounded text-sm ${!zielartFilter ? 'bg-indigo-100 text-indigo-700' : 'bg-white border text-gray-600'}`}>Alle Ereignisse</a>
            <a href="/audit?type=SECRET" className={`px-3 py-1 rounded text-sm ${zielartFilter === 'SECRET' ? 'bg-indigo-100 text-indigo-700' : 'bg-white border text-gray-600'}`}>Geheimnisse</a>
            <a href="/audit?type=VAULT" className={`px-3 py-1 rounded text-sm ${zielartFilter === 'VAULT' ? 'bg-indigo-100 text-indigo-700' : 'bg-white border text-gray-600'}`}>Tresore</a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Zeitpunkt</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">Benutzer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">Aktion</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Ziel</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ereignisse.map((event: any) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="font-mono">{format(event.timestamp, "dd. MMM HH:mm:ss", { locale: de })}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.actor?.name || 'System'}</div>
                    <div className="text-sm text-gray-500">{event.actor?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAktionsfarbe(event.action)}`}>
                      {aktionsLabel[event.action] ?? event.action}
                    </span>
                    {event.metadata && (
                      <div className="text-xs text-gray-400 mt-1">{getKontextZusammenfassung(event.metadata)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="font-medium text-gray-900">{event.targetType}</div>
                    <div className="font-mono text-xs">{event.targetId.substring(0, 8)}...</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {ereignisse.length === 0 && (
             <div className="text-center py-12 text-sm text-gray-500">Keine Ereignisse gefunden, die den Kriterien entsprechen.</div>
          )}
        </div>
      </div>
    </div>
  );
}
