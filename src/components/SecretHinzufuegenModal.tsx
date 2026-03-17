"use client";

import { useState } from "react";
import { createSecretAction } from "@/app/actions/secrets";
import { Key, X, AlertCircle } from "lucide-react";

export default function SecretHinzufuegenModal({ vaultId }: { vaultId: string }) {
  const [offen, setOffen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLaedt(true);
    setFehler(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const value = formData.get("value") as string;
    const type = formData.get("type") as string;

    try {
      await createSecretAction(vaultId, name, type, value);
      setOffen(false);
    } catch (err: any) {
      setFehler(err.message || "Fehler beim Erstellen des Geheimnisses.");
    } finally {
      setLaedt(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOffen(true)}
        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
      >
        Geheimnis hinzufügen
      </button>

      {offen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOffen(false)} />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <Key className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Neues Geheimnis</h2>
              </div>
              <button onClick={() => setOffen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input name="name" type="text" required placeholder="z.B. AWS Root Key" className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                <select name="type" className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900">
                  <option value="LOGIN">Login / Passwort</option>
                  <option value="API_KEY">API Schlüssel</option>
                  <option value="NOTE">Sichere Notiz</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Geheimnis-Wert</label>
                <input name="value" type="password" required placeholder="Das eigentliche Passwort" className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900" />
              </div>

              {fehler && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {fehler}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setOffen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                  Abbrechen
                </button>
                <button type="submit" disabled={laedt} className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {laedt ? "Wird gespeichert..." : "Sicher speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
