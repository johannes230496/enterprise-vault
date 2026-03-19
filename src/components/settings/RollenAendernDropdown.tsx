"use client";
import { useState } from "react";
import { rolleAendernAction } from "@/app/actions/settings";

const ROLLEN = [
  { value: "SECURITY_ADMIN", label: "Sicherheitsadmin", color: "bg-red-100 text-red-800" },
  { value: "MEMBER", label: "Mitglied", color: "bg-blue-100 text-blue-800" },
  { value: "GUEST", label: "Gast", color: "bg-gray-100 text-gray-700" },
];

export default function RollenAendernDropdown({ userId, aktuelleRolle }: { userId: string; aktuelleRolle: string }) {
  const [rolle, setRolle] = useState(aktuelleRolle);
  const [laedt, setLaedt] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const neueRolle = e.target.value;
    setLaedt(true);
    const result = await rolleAendernAction(userId, neueRolle);
    if (!result.error) setRolle(neueRolle);
    setLaedt(false);
  };

  const aktuell = ROLLEN.find(r => r.value === rolle);

  return (
    <select
      value={rolle}
      onChange={handleChange}
      disabled={laedt}
      className={`text-xs font-semibold rounded-full px-2 py-0.5 border-0 cursor-pointer ${aktuell?.color ?? "bg-gray-100 text-gray-700"} disabled:opacity-50`}
    >
      {ROLLEN.map(r => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  );
}
