"use client";

import { useState } from "react";
import { revealSecretAction } from "@/app/actions/secrets";
import { Eye, EyeOff, Copy, AlertCircle, Lock } from "lucide-react";
import { deriveKey, decryptClientSide } from "@/lib/crypto";

interface SecretRowProps {
  secret: any;
  permissions: any;
}

export default function SecretRow({ secret, permissions }: SecretRowProps) {
  const [aufgedeckterWert, setAufgedeckterWert] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [wirdAufgedeckt, setWirdAufgedeckt] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const [zeigePasswortEingabe, setZeigePasswortEingabe] = useState(false);
  const [passwort, setPasswort] = useState("");

  const handleAnzeigen = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (aufgedeckterWert) {
      setAufgedeckterWert(null);
      return;
    }

    if (!zeigePasswortEingabe && !aufgedeckterWert) {
      setZeigePasswortEingabe(true);
      return;
    }

    setWirdAufgedeckt(true);
    setFehler(null);
    try {
      const payload = await revealSecretAction(secret.id);
      
      // Zero-Knowledge: Decrypt locally
      const key = await deriveKey(passwort, secret.id); // Using secretId as salt for demo
      const klartext = await decryptClientSide(payload.encryptedData, payload.iv, key);
      
      setAufgedeckterWert(klartext);
      setZeigePasswortEingabe(false);
      setPasswort("");
    } catch (e: any) {
      setFehler("Falsches Passwort oder Entschlüsselungsfehler.");
      console.error(e);
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

  return (
    <div className="bg-white border text-left border-gray-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm">
      <div className="mb-4 md:mb-0">
        <h4 className="font-semibold text-gray-900">{secret.name}</h4>
        <p className="text-sm text-gray-500">{secret.contentType}</p>
      </div>

      <div className="flex flex-col items-end space-y-2">
        <div className="flex items-center space-x-3">
          {permissions.use && (
            <button className="text-sm font-medium text-gray-600 hover:text-indigo-600 bg-gray-100 px-3 py-1.5 rounded-md">
              Autofill
            </button>
          )}

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
             <button className="text-sm font-medium text-gray-600 hover:text-indigo-600 px-3 py-1.5 border border-transparent hover:bg-gray-50 rounded-md">
               Bearbeiten
             </button>
          )}
        </div>

        {zeigePasswortEingabe && !aufgedeckterWert && (
          <form onSubmit={handleAnzeigen} className="mt-2 flex items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="password" 
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
                placeholder="Tresor-Passwort"
                autoFocus
                className="w-full text-sm border border-gray-300 rounded-md pl-9 pr-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button 
              type="submit"
              disabled={!passwort || wirdAufgedeckt}
              className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              OK
            </button>
            <button 
              type="button"
              onClick={() => { setZeigePasswortEingabe(false); setPasswort(""); }}
              className="text-gray-500 text-xs px-2 hover:text-gray-700"
            >
              Abbrechen
            </button>
          </form>
        )}

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
  );
}
