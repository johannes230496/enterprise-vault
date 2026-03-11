"use client";

import { useState } from "react";
import { updateGroup, deleteGroup, addGroupMember, removeGroupMember } from "@/app/actions/groups";
import { Users, Trash2, UserPlus, UserMinus, Save, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GroupManagementClient({ 
  group, 
  availableUsers,
  isOwner 
}: { 
  group: any, 
  availableUsers: any[],
  isOwner: boolean 
}) {
  const router = useRouter();
  const [name, setName] = useState(group.name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateName = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      await updateGroup(group.id, name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Möchten Sie diese Gruppe wirklich dauerhaft löschen?")) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteGroup(group.id);
      router.push("/groups");
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setError(null);
    try {
      await addGroupMember(group.id, userId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setError(null);
    try {
      await removeGroupMember(group.id, userId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/groups" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Zurück zur Übersicht
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-lg mr-4">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Gruppe verwalten</h1>
          </div>
          {isOwner && (
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center text-sm font-medium"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Gruppe löschen
            </button>
          )}
        </div>

        <div className="p-8 space-y-8">
          {/* Sektion: Name */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Allgemeine Einstellungen</h2>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Gruppenname</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleUpdateName}
                  disabled={isUpdating || name === group.name}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center h-[42px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Speichern
                </button>
              </div>
            </div>
          </section>

          {/* Sektion: Mitglieder */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-t border-gray-100 pt-8">Mitglieder verwalten</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Aktuelle Mitglieder */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  Aktuelle Mitglieder ({group.members.length})
                </h3>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {group.members.map((membership: any) => (
                    <div key={membership.user.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">
                          {membership.user.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{membership.user.name}</p>
                          <p className="text-xs text-gray-500">{membership.user.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveMember(membership.user.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Entfernen"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {group.members.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500 italic">
                      Keine Mitglieder in dieser Gruppe.
                    </div>
                  )}
                </div>
              </div>

              {/* Benutzer hinzufügen */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  Mitglieder hinzufügen
                </h3>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {availableUsers.map((user: any) => (
                    <div key={user.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 mr-3">
                          {user.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddMember(user.id)}
                        className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
                        title="Hinzufügen"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {availableUsers.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500 italic">
                      Keine weiteren Benutzer verfügbar.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
