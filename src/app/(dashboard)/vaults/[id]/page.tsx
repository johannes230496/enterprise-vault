import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePermissions, auditLog } from "@/lib/authz";
import { notFound } from "next/navigation";
import { Shield, Settings, Users as UsersIcon, Clock } from "lucide-react";
import SecretRow from "@/components/SecretRow";
import SecretHinzufuegenModal from "@/components/SecretHinzufuegenModal";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export default async function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const { id: vaultId } = await params;
  
  const vault = await prisma.vault.findUnique({
    where: { id: vaultId },
    include: { organization: true }
  });

  if (!vault) notFound();

  const berechtigungen = await getEffectivePermissions(session.user.id as string, vault.id);
  
  if (!berechtigungen.use && !berechtigungen.reveal && !berechtigungen.manage && !berechtigungen.edit) {
    await auditLog(session.user.id as string, "VAULT_MANAGE", "VAULT", vault.id, { status: "DENIED_VIEW" });
    return (
      <div className="p-8 text-center border rounded-lg bg-red-50 text-red-800 border-red-200">
        <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold">Zugriff verweigert</h2>
        <p>Sie haben keine Berechtigungen in diesem Tresor.</p>
      </div>
    );
  }

  const geheimnisse = await prisma.secret.findMany({
    where: { vaultId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-wrap gap-4 items-start justify-between border-b border-gray-200 pb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 text-indigo-600 mr-3 flex-shrink-0" />
            <span className="break-words">{vault.name}</span>
          </h1>
          <p className="text-gray-500 mt-2">{vault.description}</p>
        </div>

        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {berechtigungen.manage && (
            <Link href={`/vaults/${vault.id}/members`} className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 whitespace-nowrap">
              <UsersIcon className="w-4 h-4 mr-2" />
              Zugriff verwalten
            </Link>
          )}
          {berechtigungen.edit && (
            <SecretHinzufuegenModal vaultId={vault.id} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            Geheimnisse ({geheimnisse.length})
          </h3>
          
          {geheimnisse.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg border-dashed">
              <p className="text-gray-500">Keine Geheimnisse in diesem Tresor gefunden.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {geheimnisse.map((secret: any) => (
                <SecretRow key={secret.id} secret={secret} permissions={berechtigungen} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-slate-500" />
              Meine effektiven Berechtigungen
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-600">Autofill / Verwenden</span>
                <span className={berechtigungen.use ? "text-green-600 font-medium" : "text-slate-400"}>{berechtigungen.use ? "Erlaubt" : "Verweigert"}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-600">Passwort anzeigen</span>
                <span className={berechtigungen.reveal ? "text-green-600 font-medium" : "text-slate-400"}>{berechtigungen.reveal ? "Erlaubt" : "Verweigert"}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-600">Erstellen / Bearbeiten</span>
                <span className={berechtigungen.edit ? "text-green-600 font-medium" : "text-slate-400"}>{berechtigungen.edit ? "Erlaubt" : "Verweigert"}</span>
              </li>
              <li className="flex justify-between border-t border-slate-200 pt-3">
                <span className="text-slate-600">Mitglieder verwalten</span>
                <span className={berechtigungen.manage ? "text-indigo-600 font-medium" : "text-slate-400"}>{berechtigungen.manage ? "Erlaubt" : "Verweigert"}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-600">Tresor exportieren</span>
                <span className={berechtigungen.export ? "text-red-600 font-medium" : "text-slate-400"}>{berechtigungen.export ? "Erlaubt" : "Verweigert"}</span>
              </li>
            </ul>
          </div>

          <div className="text-xs text-gray-500 flex items-center">
            <Clock className="w-4 h-4 mr-1.5" />
            Tresor erstellt {formatDistanceToNow(vault.createdAt, { addSuffix: true, locale: de })}
          </div>
        </div>

      </div>
    </div>
  );
}
