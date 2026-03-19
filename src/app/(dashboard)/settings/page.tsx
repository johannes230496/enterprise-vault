import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Settings, Users, Shield, Building2, Mail, Clock } from "lucide-react";
import { format } from "date-fns";
import BenutzerEinladenModal from "@/components/settings/BenutzerEinladenModal";
import BenutzerLoeschenButton from "@/components/settings/BenutzerLoeschenButton";
import EinladungAktionen from "@/components/settings/EinladungAktionen";
import RollenAendernDropdown from "@/components/settings/RollenAendernDropdown";
import SicherheitsrichtlinieToggle from "@/components/settings/SicherheitsrichtlinieToggle";
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

  const offeneEinladungen = await prisma.invitation.findMany({
    where: {
      organizationId: user.organizationId as string,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  const orgSettings = await prisma.orgSettings.findUnique({
    where: { organizationId: user.organizationId as string },
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
          <BenutzerEinladenModal />
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
                      {u.globalRole === "OWNER" || istIchSelbst ? (
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${rolle.color}`}>
                          {rolle.label}
                        </span>
                      ) : (
                        <RollenAendernDropdown userId={u.id} aktuelleRolle={u.globalRole} />
                      )}
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
                      {!istIchSelbst && u.globalRole !== "OWNER" && (
                        <BenutzerLoeschenButton userId={u.id} name={u.name ?? u.email ?? "?"} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Offene Einladungen */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <Mail className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="font-semibold text-gray-900">Offene Einladungen</h2>
          <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
            {offeneEinladungen.length}
          </span>
        </div>
        {offeneEinladungen.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Keine offenen Einladungen</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / E-Mail</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Läuft ab</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offeneEinladungen.map((inv: any) => {
                  const rolle = rollenBeschriftungen[inv.role] ?? { label: inv.role, color: "bg-gray-100 text-gray-700" };
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                        <p className="text-xs text-gray-500">{inv.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${rolle.color}`}>
                          {rolle.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                          {format(inv.expiresAt, "dd.MM.yy HH:mm", { locale: de })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <EinladungAktionen invitationId={inv.id} token={inv.token} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sicherheitsrichtlinie */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <Shield className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="font-semibold text-gray-900">Sicherheitsrichtlinien</h2>
        </div>
        <div className="px-6 py-5 divide-y divide-gray-100">
          <SicherheitsrichtlinieToggle feld="enforce2FA" label="Zwei-Faktor-Authentifizierung (2FA) erzwingen" initialWert={orgSettings?.enforce2FA ?? false} />
          <SicherheitsrichtlinieToggle feld="preventExport" label="Passwort-Export für Mitglieder verhindern" initialWert={orgSettings?.preventExport ?? true} />
          <SicherheitsrichtlinieToggle feld="auditAll" label="Audit-Protokoll für alle Zugriffe aktivieren" initialWert={orgSettings?.auditAll ?? true} />
          <SicherheitsrichtlinieToggle feld="sessionTimeout" label="Automatischer Sitzungsablauf nach 8 Stunden" initialWert={true} readonly={true} />
        </div>
      </section>

    </div>
  );
}
