"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as argon2 from "argon2";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const einladenSchema = z.object({
  name:  z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  rolle: z.enum(["SECURITY_ADMIN", "MEMBER", "GUEST"]),
});

export async function benutzerEinladen(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Nicht authentifiziert" };

  const einladender = await prisma.user.findUnique({
    where: { id: session.user.id as string },
  });

  if (einladender?.globalRole !== "OWNER") {
    return { error: "Nur der Eigentümer kann Benutzer einladen" };
  }

  const validierung = einladenSchema.safeParse({
    name:  formData.get("name"),
    email: formData.get("email"),
    rolle: formData.get("rolle"),
  });

  if (!validierung.success) {
    return { error: validierung.error.issues[0].message };
  }

  const { name, email, rolle } = validierung.data;

  const vorhanden = await prisma.user.findUnique({ where: { email } });
  if (vorhanden) return { error: "Ein Benutzer mit dieser E-Mail existiert bereits" };

  const vorhandeneEinladung = await prisma.invitation.findFirst({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } }
  });
  if (vorhandeneEinladung) return { error: "Für diese E-Mail existiert bereits eine aktive Einladung" };

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.invitation.create({
    data: {
      token,
      email,
      name,
      role: rolle,
      organizationId: einladender.organizationId as string,
      invitedById: einladender.id,
      expiresAt,
    },
  });

  revalidatePath("/settings");
  return { success: true, token };
}

const passwortSchema = z.object({
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
});

export async function acceptInvitationAction(token: string, formData: FormData) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation) return { error: "Ungültige Einladung" };
  if (invitation.usedAt) return { error: "Diese Einladung wurde bereits verwendet" };
  if (invitation.expiresAt < new Date()) return { error: "Diese Einladung ist abgelaufen" };

  const validierung = passwortSchema.safeParse({ password: formData.get("password") });
  if (!validierung.success) return { error: validierung.error.issues[0].message };

  const vorhanden = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (vorhanden) return { error: "Ein Konto mit dieser E-Mail existiert bereits" };

  const passwordHash = await argon2.hash(validierung.data.password);

  await prisma.user.create({
    data: {
      name: invitation.name,
      email: invitation.email,
      passwordHash,
      globalRole: invitation.role,
      organizationId: invitation.organizationId,
    },
  });

  await prisma.invitation.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  return { success: true };
}

export async function einladungErneuernAction(invitationId: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Nicht authentifiziert" };

  const einladender = await prisma.user.findUnique({
    where: { id: session.user.id as string },
  });
  if (einladender?.globalRole !== "OWNER") return { error: "Keine Berechtigung" };

  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.organizationId !== einladender.organizationId) {
    return { error: "Einladung nicht gefunden" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { token, expiresAt },
  });

  revalidatePath("/settings");
  return { success: true, token };
}
