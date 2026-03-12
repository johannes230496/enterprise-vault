"use server"

import { prisma } from "@/lib/prisma"
import * as argon2 from "argon2"
import { z } from "zod"

const registrationSchema = z.object({
  organizationName: z.string().min(2, "Organisationsname muss mindestens 2 Zeichen lang sein"),
  fullName: z.string().min(2, "Vollständiger Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
})

export async function register(formData: FormData) {
  const organizationName = formData.get("organizationName") as string
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Validate data
  const validation = registrationSchema.safeParse({
    organizationName,
    fullName,
    email,
    password,
  })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits" }
    }

    // Hash password
    const passwordHash = await argon2.hash(password)

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: organizationName,
        },
      })

      const user = await tx.user.create({
        data: {
          name: fullName,
          email,
          passwordHash,
          organizationId: org.id,
          globalRole: "OWNER", // First user is the owner
        },
      })

      return { org, user }
    })

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut." }
  }
}
