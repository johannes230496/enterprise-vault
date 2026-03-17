"use client";

import { useState } from "react";
import { revealSecretAction, updateSecretAction } from "@/app/actions/secrets";
import { Eye, EyeOff, Copy, AlertCircle, X, Pencil } from "lucide-react";

interface SecretRowProps {
  secret: any;
  permissions: any;
}

export default function SecretRow({ secret, permissions }: SecretRowProps) {
  const [aufgedeckterWert, setAufgedeckterWert] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [wirdAufgedeckt, setWirdAufgedeckt] = useState(false);
  const [kopiert, setKopiert] = useState(false);

  // Edit state
  const [editOffen, setEditOffen] = useState(false);
  const [editName, setEditName] = useState(secret.name);
  const [editType, setEditType] = useState(secret.contentType);
  const [editWert, setEditWert] = useState("");
  const [editFehler, setEditFehler] = useState<string | null>(null);
  const [wirdGespeichert, setWirdGespeichert] = useState(false);

  const handleAnzeigen = async () => {
    if (aufgedeckterWert) {
      setAufgedeckterWert(null);
      return;
    }

    setWirdAufgedeckt(true);
    setFehler(null);
    try {
      const { plaintext } = await revealSecretAction(secret.id);
      setAufgedeckterWert(plaintext);
    } catch (e: any) {
      setFehler(e.message || "Entschlüsselungsfehler.");
    } finally {
      setWirdAufgedeckt(false);
    }
  };

  const handleKopieren = () => {
    if (aufgedeckterWert) {
      navigator.clipboard.writeText(aufgedeckterWert);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWert) {
      setEditFehler("Bitte einen neuen Wert eingeben.");
      return;
    }
    setWirdGespeichert(true);
    setEditFehler(null);
    try {
      await updateSecretAction(secret.id, editName, editType, editWert);
      setAufgedeckterWert(null);
      setEditOffen(false);
      setEditWert("");
    } catch (e: any) {
      setEditFehler(e.message || "Fehler beim Speichern.");
    } finally {
      setWirdGespeichert(false);
    }
  };

  return (
    <>
      <div className="bg-white border text-left border-gray-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm">
        <div className="mb-4 md:mb-0">
          <h4 className="font-semibold text-gray-900">{secret.name}</h4>
          <p className="text-sm text-gray-500">{secret.contentType}</p>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-3">
            {permissions.reveal && (
              <button
                onClick={handleAnzeigen}
                disabled={wirdAufgedeckt}
                className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                  aufgedeckterWert
                    ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {wirdAufgedeckt ? (
                  <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : aufgedeckterWert ? (
                  <EyeOff className="w-4 h-4 mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {aufgedeckterWert ? "Verbergen" : "Anzeigen"}
              </button>
            )}

            {permissions.edit && (
              <button
                onClick={() => { setEditOffen(true); setEditFehler(null); setEditWert(""); }}
                className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 px-3 py-1.5 border border-transparent hover:bg-gray-50 rounded-md"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Bearbeiten
              </button>
            )}
          </div>

          {aufgedeckterWert && (
            <div className="mt-2 flex items-center bg-gray-900 text-green-400 font-mono text-sm px-4 py-2 rounded-md w-full md:w-auto">
              <span className="mr-3 tracking-wider">{aufgedeckterWert}</span>
              <button onClick={handleKopieren} className="text-gray-400 hover:text-white transition-colors">
                {kopiert ? <span className="text-xs text-white uppercase font-sans tracking-normal">Kopiert</span> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}

          {fehler && (
            <div className="flex items-center text-red-600 text-sm mt-2">
              <AlertCircle className="w-4 h-4 mr-1" />
              {fehler}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditOffen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-semibold text-gray-900">Geheimnis bearbeiten</h2>
              <button onClick={() => setEditOffen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900"
                >
                  <option value="LOGIN">Login / Passwort</option>
                  <option value="API_KEY">API Schlüssel</option>
                  <option value="NOTE">Sichere Notiz</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neuer Wert</label>
                <input
                  type="password"
                  value={editWert}
                  onChange={e => setEditWert(e.target.value)}
                  placeholder="Neues Passwort eingeben"
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900"
                />
              </div>

              {editFehler && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {editFehler}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setEditOffen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                  Abbrechen
                </button>
                <button type="submit" disabled={wirdGespeichert} className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {wirdGespeichert ? "Wird gespeichert..." : "Speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
