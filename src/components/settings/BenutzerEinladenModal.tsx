"use client";

import { useState } from "react";
import { UserPlus, X, Copy, CheckCircle, Link as LinkIcon } from "lucide-react";
import { benutzerEinladen } from "@/app/actions/settings";

export default function BenutzerEinladenModal() {
  const [offen, setOffen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [einladungsLink, setEinladungsLink] = useState<string | null>(null);
  const [kopiert, setKopiert] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLaedt(true);
    setFehler(null);

    const formData = new FormData(e.currentTarget);
    const ergebnis = await benutzerEinladen(formData);

    if (ergebnis?.error) {
      setFehler(ergebnis.error);
    } else if (ergebnis?.token) {
      const link = `${window.location.origin}/invite/${ergebnis.token}`;
      setEinladungsLink(link);
    }
    setLaedt(false);
  };

  const handleKopieren = async () => {
    if (!einladungsLink) return;
    let success = false;
    try {
      await navigator.clipboard.writeText(einladungsLink);
      success = true;
    } catch {
      // clipboard API not available or permission denied — use fallback
    }
    if (!success) {
      const ta = document.createElement("textarea");
      ta.value = einladungsLink;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2000);
  };

  const handleSchliessen = () => {
    setOffen(false);
    setEinladungsLink(null);
    setFehler(null);
    setKopiert(false);
  };

  return (
    <>
      <button
        onClick={() => setOffen(true)}
        className="flex items-center bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700"
      >
        <UserPlus className="w-4 h-4 mr-1.5" aria-hidden="true" />
        Benutzer einladen
      </button>

      {offen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleSchliessen} />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Benutzer einladen</h2>
              </div>
              <button onClick={handleSchliessen} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {einladungsLink ? (
              <div className="space-y-4">
                <div className="flex items-center text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium">Einladung erstellt! Teilen Sie diesen Link:</span>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center gap-2">
                  <input
                    readOnly
                    value={einladungsLink}
                    onClick={e => (e.target as HTMLInputElement).select()}
                    className="text-xs text-gray-600 font-mono flex-1 bg-transparent outline-none cursor-text min-w-0"
                  />
                  <button
                    onClick={handleKopieren}
                    className="flex-shrink-0 text-indigo-600 hover:text-indigo-800 px-1"
                  >
                    {kopiert
                      ? <span className="text-xs font-medium text-green-600">Kopiert!</span>
                      : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  Der Link ist 7 Tage gültig. Der Benutzer setzt sein eigenes Passwort.
                </p>

                <button
                  onClick={handleSchliessen}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Fertig
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vollständiger Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="z.B. Max Mustermann"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail-Adresse <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="max@acme.inc"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rolle <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="rolle"
                    required
                    defaultValue="MEMBER"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                  >
                    <option value="MEMBER">Mitglied</option>
                    <option value="SECURITY_ADMIN">Sicherheitsadmin</option>
                    <option value="GUEST">Gast</option>
                  </select>
                </div>

                {fehler && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
                    {fehler}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSchliessen}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={laedt}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                  >
                    {laedt ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Wird erstellt...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1.5" />
                        Einladungslink erstellen
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
