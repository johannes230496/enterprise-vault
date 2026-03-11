import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Settings, Users, Shield, Building2, Trash2, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default async function EinstellungenSeite() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({ where: { id: session.user.id as string } });

  // Nur Eigentümer dürfen diese Seite sehen
  if (user?.globalRole !== "OWNER") {
    redirect("/dashboard");
  }

  const organisation = await prisma.organization.findUnique({
    where: { id: user.organizationId as string },
  });

  const alleBenutzer = await prisma.user.findMany({
    where: { organizationId: user.organizationId as string },
    include: {
      groupMemberships: {
        include: { group: true }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  const rollenBeschriftungen: Record<string, { label: string; color: string }> = {
    OWNER:          { label: "Eigentümer",       color: "bg-purple-100 text-purple-800" },
    SECURITY_ADMIN: { label: "Sicherheitsadmin", color: "bg-red-100 text-red-800" },
    MEMBER:         { label: "Mitglied",          color: "bg-blue-100 text-blue-800" },
    GUEST:          { label: "Gast",              color: "bg-gray-100 text-gray-700" },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center">
        <Settings className="w-8 h-8 text-indigo-600 mr-3" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Org.-Einstellungen</h1>
          <p className="text-gray-500 text-sm mt-0.5">Verwalten Sie Ihre Organisation, Benutzer und Sicherheitsrichtlinien.</p>
        </div>
      </div>

      {/* Organisation Info */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <Building2 className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="font-semibold text-gray-900">Organisation</h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Name</p>
            <p className="text-gray-900 font-medium">{organisation?.name ?? "–"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Erstellt am</p>
            <p className="text-gray-900 font-medium">
              {organisation?.createdAt
                ? format(organisation.createdAt, "dd. MMMM yyyy", { locale: de })
                : "–"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Benutzer gesamt</p>
            <p className="text-gray-900 font-medium">{alleBenutzer.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Org.-ID</p>
            <p className="text-gray-500 font-mono text-xs">{user.organizationId}</p>
          </div>
        </div>
      </section>

      {/* Benutzerverwaltung */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-500 mr-2" />
            <h2 className="font-semibold text-gray-900">Benutzerverwaltung</h2>
          </div>
          <button className="flex items-center bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700">
            <UserPlus className="w-4 h-4 mr-1.5" />
            Benutzer einladen
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benutzer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gruppen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erstellt</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alleBenutzer.map((u: any) => {
                const rolle = rollenBeschriftungen[u.globalRole] ?? { label: u.globalRole, color: "bg-gray-100 text-gray-700" };
                const istIchSelbst = u.id === user.id;
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm mr-3">
                          {u.name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {u.name}
                            {istIchSelbst && <span className="ml-2 text-xs text-indigo-600 font-normal">(Sie)</span>}
                          </p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${rolle.color}`}>
                        {rolle.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.groupMemberships.length === 0
                          ? <span className="text-xs text-gray-400">–</span>
                          : u.groupMemberships.map((gm: any) => (
                              <span key={gm.groupId} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                                {gm.group.name}
                              </span>
                            ))
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {format(u.createdAt, "dd.MM.yy", { locale: de })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!istIchSelbst && (
                        <button
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Benutzer entfernen"
                          disabled
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sicherheitsrichtlinie */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <Shield className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="font-semibold text-gray-900">Sicherheitsrichtlinien</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: "Zwei-Faktor-Authentifizierung (2FA) erzwingen", aktiv: false },
            { label: "Passwort-Export für Mitglieder verhindern", aktiv: true },
            { label: "Audit-Protokoll für alle Zugriffe aktivieren", aktiv: true },
            { label: "Automatischer Sitzungsablauf nach 8 Stunden", aktiv: true },
          ].map((regel) => (
            <div key={regel.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-700">{regel.label}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${regel.aktiv ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                {regel.aktiv ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
