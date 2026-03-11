"use client";

import { useState } from "react";
import { createGroup } from "@/app/actions/groups";
import { Users, X } from "lucide-react";

export default function GruppeErstellenModal() {
  const [offen, setOffen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLaedt(true);
    setFehler(null);
    try {
      await createGroup(name);
      setOffen(false);
      setName("");
    } catch (err: any) {
      setFehler(err.message || "Fehler beim Erstellen der Gruppe");
    } finally {
      setLaedt(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOffen(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-indigo-700"
      >
        Gruppe erstellen
      </button>

      {offen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Hintergrund-Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOffen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Neue Gruppe erstellen</h2>
              </div>
              <button
                onClick={() => setOffen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Gruppenname <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Entwickler-Team"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                />
              </div>

              {fehler && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
                  {fehler}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOffen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={laedt || !name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {laedt ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Wird erstellt...
                    </>
                  ) : "Gruppe erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
