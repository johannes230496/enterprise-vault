"use client";

import { useState } from "react";
import { Trash2, AlertCircle } from "lucide-react";
import { deleteUserAction } from "@/app/actions/users";

export default function BenutzerLoeschenButton({ userId, name }: { userId: string; name: string }) {
  const [bestaetigung, setBestaetigung] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const handleLoeschen = async () => {
    if (!bestaetigung) {
      setBestaetigung(true);
      return;
    }
    setLaedt(true);
    setFehler(null);
    try {
      await deleteUserAction(userId);
    } catch (e: any) {
      setFehler(e.message);
      setBestaetigung(false);
    } finally {
      setLaedt(false);
    }
  };

  if (fehler) {
    return (
      <span className="flex items-center text-red-600 text-xs">
        <AlertCircle className="w-3 h-3 mr-1" />{fehler}
      </span>
    );
  }

  if (bestaetigung) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600">Sicher?</span>
        <button
          onClick={handleLoeschen}
          disabled={laedt}
          className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {laedt ? "..." : "Ja, löschen"}
        </button>
        <button
          onClick={() => setBestaetigung(false)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Abbrechen
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLoeschen}
      title={`${name} entfernen`}
      className="text-gray-400 hover:text-red-600 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
