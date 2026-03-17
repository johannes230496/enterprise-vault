"use client";

import { useState } from "react";
import { addVaultMemberAction, removeVaultMemberAction } from "@/app/actions/vaults";
import { Users, UserCircle, Trash2, Plus, AlertCircle } from "lucide-react";

type Membership = {
  id: string;
  type: "user" | "group";
  name: string;
  memberId: string;
  permissions: { use: boolean; reveal: boolean; edit: boolean; manage: boolean; export: boolean };
};

type Props = {
  vaultId: string;
  memberships: Membership[];
  availableUsers: { id: string; name: string }[];
  availableGroups: { id: string; name: string }[];
};

const PERM_LABELS: { key: keyof Membership["permissions"]; label: string }[] = [
  { key: "use", label: "Verwenden" },
  { key: "reveal", label: "Anzeigen" },
  { key: "edit", label: "Bearbeiten" },
  { key: "manage", label: "Verwalten" },
  { key: "export", label: "Exportieren" },
];

export default function VaultMembersClient({ vaultId, memberships: initial, availableUsers, availableGroups }: Props) {
  const [memberships, setMemberships] = useState(initial);
  const [addType, setAddType] = useState<"user" | "group">("group");
  const [selectedId, setSelectedId] = useState("");
  const [perms, setPerms] = useState({ use: true, reveal: false, edit: false, manage: false, export: false });
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setLaedt(true);
    setFehler(null);
    try {
      await addVaultMemberAction(vaultId, addType, selectedId, perms);
      const name = addType === "group"
        ? availableGroups.find(g => g.id === selectedId)?.name ?? selectedId
        : availableUsers.find(u => u.id === selectedId)?.name ?? selectedId;
      setMemberships(prev => [...prev, { id: Date.now().toString(), type: addType, name, memberId: selectedId, permissions: { ...perms } }]);
      setSelectedId("");
      setPerms({ use: true, reveal: false, edit: false, manage: false, export: false });
    } catch (e: any) {
      setFehler(e.message);
    } finally {
      setLaedt(false);
    }
  };

  const handleRemove = async (membershipId: string) => {
    setLaedt(true);
    try {
      await removeVaultMemberAction(membershipId, vaultId);
      setMemberships(prev => prev.filter(m => m.id !== membershipId));
    } catch (e: any) {
      setFehler(e.message);
    } finally {
      setLaedt(false);
    }
  };

  const options = addType === "group" ? availableGroups : availableUsers;

  return (
    <div className="space-y-6">
      {/* Current Members */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center">
          <Users className="w-4 h-4 text-gray-500 mr-2" />
          <h2 className="font-semibold text-gray-900">Aktuelle Mitglieder ({memberships.length})</h2>
        </div>

        {memberships.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Noch keine Mitglieder hinzugefügt.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                {PERM_LABELS.map(p => (
                  <th key={p.key} className="px-3 py-3 text-center">{p.label}</th>
                ))}
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {memberships.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center">
                      {m.type === "group"
                        ? <Users className="w-4 h-4 text-indigo-500 mr-2" />
                        : <UserCircle className="w-4 h-4 text-gray-400 mr-2" />}
                      <span className="text-sm font-medium text-gray-900">{m.name}</span>
                      <span className="ml-2 text-xs text-gray-400">{m.type === "group" ? "Gruppe" : "Benutzer"}</span>
                    </div>
                  </td>
                  {PERM_LABELS.map(p => (
                    <td key={p.key} className="px-3 py-3 text-center">
                      {m.permissions[p.key]
                        ? <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                        : <span className="inline-block w-2 h-2 rounded-full bg-gray-200" />}
                    </td>
                  ))}
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleRemove(m.id)}
                      disabled={laedt}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Add Member */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center">
          <Plus className="w-4 h-4 text-gray-500 mr-2" />
          <h2 className="font-semibold text-gray-900">Mitglied hinzufügen</h2>
        </div>

        <form onSubmit={handleAdd} className="p-6 space-y-5">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Typ</label>
              <select
                value={addType}
                onChange={e => { setAddType(e.target.value as "user" | "group"); setSelectedId(""); }}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900"
              >
                <option value="group">Gruppe</option>
                <option value="user">Einzelner Benutzer</option>
              </select>
            </div>
            <div className="flex-[2]">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {addType === "group" ? "Gruppe" : "Benutzer"}
              </label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900"
              >
                <option value="">— Auswählen —</option>
                {options.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Berechtigungen</label>
            <div className="flex flex-wrap gap-4">
              {PERM_LABELS.map(p => (
                <label key={p.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={perms[p.key]}
                    onChange={e => setPerms(prev => ({ ...prev, [p.key]: e.target.checked }))}
                    className="rounded text-indigo-600"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          {fehler && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />{fehler}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={laedt || !selectedId}
              className="flex items-center bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {laedt ? "Wird hinzugefügt..." : "Hinzufügen"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
