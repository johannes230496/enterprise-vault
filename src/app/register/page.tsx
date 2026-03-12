"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { register } from "@/app/actions/register"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await register(formData)
      if (result.error) {
        setError(result.error)
      } else {
        router.push("/login?registered=true")
      }
    } catch (err) {
      setError("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Registrierung
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Erstellen Sie einen neuen Arbeitsbereich für Ihre Organisation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Organisationsname</label>
              <div className="mt-1">
                <input
                  name="organizationName"
                  type="text"
                  required
                  placeholder="z.B. Acme Corp"
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Vollständiger Name</label>
              <div className="mt-1">
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder="Max Mustermann"
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">E-Mail-Adresse</label>
              <div className="mt-1">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@organisation.com"
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Passwort</label>
              <div className="mt-1">
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? "Erstellung läuft..." : "Kostenlos registrieren"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Bereits registriert?{" "}
                  <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Anmelden
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
