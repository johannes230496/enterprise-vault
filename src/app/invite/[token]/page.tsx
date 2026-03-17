"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { acceptInvitationAction } from "@/app/actions/settings";
import { Shield, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [erfolg, setErfolg] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirm) {
      setFehler("Passwörter stimmen nicht überein.");
      return;
    }
    setLaedt(true);
    setFehler(null);
    const formData = new FormData();
    formData.set("password", password);
    const result = await acceptInvitationAction(token, formData);
    if (result.error) {
      setFehler(result.error);
      setLaedt(false);
    } else {
      setErfolg(true);
    }
  };

  if (erfolg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Konto erstellt!</h2>
          <p className="text-gray-500 text-sm mb-6">Sie können sich jetzt mit Ihrer E-Mail und Ihrem Passwort anmelden.</p>
          <Link href="/login" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
            Zum Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900">Sie wurden eingeladen</h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Legen Sie Ihr Passwort fest, um Ihren Zugang zu aktivieren.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-8 py-8 shadow-sm rounded-xl border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Mindestens 8 Zeichen"
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort bestätigen</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Passwort wiederholen"
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900"
              />
            </div>

            {fehler && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-md px-3 py-2">{fehler}</p>
            )}

            <button
              type="submit"
              disabled={laedt}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {laedt ? "Wird erstellt..." : "Konto aktivieren"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
