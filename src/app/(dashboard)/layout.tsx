import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Key, Users, Settings, LogOut, Activity } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const roleBeschriftungen: Record<string, string> = {
    OWNER: "Eigentümer",
    SECURITY_ADMIN: "Sicherheitsadmin",
    MEMBER: "Mitglied",
    GUEST: "Gast"
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Seitenleiste */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Shield className="w-6 h-6 text-indigo-500 mr-3" />
          <span className="text-white font-semibold text-lg">Enterprise Vault</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1">
          <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white">
            <Activity className="w-5 h-5 mr-3 text-slate-400" />
            Dashboard
          </Link>
          <Link href="/vaults" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white">
            <Key className="w-5 h-5 mr-3 text-slate-400" />
            Tresore & Geheimnisse
          </Link>
          <Link href="/groups" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white">
            <Users className="w-5 h-5 mr-3 text-slate-400" />
            Gruppen & Zugriff
          </Link>
          <Link href="/audit" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white">
            <Activity className="w-5 h-5 mr-3 text-slate-400" />
            Audit-Protokoll
          </Link>
          {session?.user?.globalRole === 'OWNER' && (
            <Link href="/settings" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:bg-slate-800 hover:text-white">
              <Settings className="w-5 h-5 mr-3" />
              Org.-Einstellungen
            </Link>
          )}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
              {session.user?.name?.charAt(0) || "B"}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{session.user?.name}</p>
              <p className="text-xs text-slate-400">{roleBeschriftungen[session.user?.globalRole as string] || "Benutzer"}</p>
            </div>
          </div>
          <Link href="/api/auth/signout" className="mt-4 flex items-center justify-center w-full px-4 py-2 text-sm font-medium border border-slate-700 rounded-md text-slate-300 hover:bg-slate-800">
            <LogOut className="w-4 h-4 mr-2" />
            Abmelden
          </Link>
        </div>
      </aside>

      {/* Hauptinhalt */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">Arbeitsbereich</h1>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
