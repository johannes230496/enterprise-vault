"use client";
import { useState } from "react";
import { sicherheitsrichtlinieAendernAction } from "@/app/actions/settings";

export default function SicherheitsrichtlinieToggle({
  feld,
  label,
  initialWert,
  readonly = false,
}: {
  feld: string;
  label: string;
  initialWert: boolean;
  readonly?: boolean;
}) {
  const [aktiv, setAktiv] = useState(initialWert);
  const [laedt, setLaedt] = useState(false);

  const handleToggle = async () => {
    if (readonly) return;
    setLaedt(true);
    const result = await sicherheitsrichtlinieAendernAction(feld, !aktiv);
    if (!result.error) setAktiv(!aktiv);
    setLaedt(false);
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      {readonly ? (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${aktiv ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
          {aktiv ? "Aktiv" : "Inaktiv"}
        </span>
      ) : (
        <button
          onClick={handleToggle}
          disabled={laedt}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${aktiv ? "bg-indigo-600" : "bg-gray-300"}`}
          title={aktiv ? "Deaktivieren" : "Aktivieren"}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${aktiv ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      )}
    </div>
  );
}
