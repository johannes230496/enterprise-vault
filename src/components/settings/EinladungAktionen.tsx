"use client";

import { useState } from "react";
import { Copy, CheckCircle, RefreshCw } from "lucide-react";
import { einladungErneuernAction } from "@/app/actions/settings";

interface Props {
  invitationId: string;
  token: string;
}

export default function EinladungAktionen({ invitationId, token: initialToken }: Props) {
  const [token, setToken] = useState(initialToken);
  const [kopiert, setKopiert] = useState(false);
  const [erneuert, setErneuert] = useState(false);
  const [laedt, setLaedt] = useState(false);

  const getLink = (t: string) => `${window.location.origin}/invite/${t}`;

  const handleKopieren = async () => {
    const link = getLink(token);
    let success = false;
    try {
      await navigator.clipboard.writeText(link);
      success = true;
    } catch {
      // fallback
    }
    if (!success) {
      const ta = document.createElement("textarea");
      ta.value = link;
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

  const handleErneuern = async () => {
    setLaedt(true);
    const result = await einladungErneuernAction(invitationId);
    if (result.token) {
      setToken(result.token);
      setErneuert(true);
      setTimeout(() => setErneuert(false), 2000);
      // auto-copy the new link
      const link = getLink(result.token);
      try {
        await navigator.clipboard.writeText(link);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    }
    setLaedt(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleKopieren}
        title="Link kopieren"
        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50"
      >
        {kopiert ? (
          <><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600">Kopiert!</span></>
        ) : (
          <><Copy className="w-3.5 h-3.5" /><span>Kopieren</span></>
        )}
      </button>

      <button
        onClick={handleErneuern}
        disabled={laedt}
        title="Neuen Link generieren (7 Tage)"
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${laedt ? "animate-spin" : ""}`} />
        <span>{erneuert ? "Neu kopiert!" : "Erneut senden"}</span>
      </button>
    </div>
  );
}
