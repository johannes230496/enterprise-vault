import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import GroupManagementClient from "@/components/groups/GroupManagementClient";

export default async function ManageGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return redirect("/login");

  const { id } = await params;

  // Prüfen, ob der Benutzer Admin ist
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true, organizationId: true }
  });

  const isGlobalAdmin = user?.globalRole === "OWNER" || user?.globalRole === "SECURITY_ADMIN";
  if (!isGlobalAdmin) {
    return redirect("/groups");
  }

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: true
        }
      }
    }
  });

  if (!group) notFound();

  // Alle Benutzer der Organisation holen, die nicht in der Gruppe sind
  const allOrgUsers = await prisma.user.findMany({
    where: {
      organizationId: user?.organizationId,
      NOT: {
        groupMemberships: {
          some: {
            groupId: id
          }
        }
      }
    }
  });

  return (
    <GroupManagementClient 
      group={group} 
      availableUsers={allOrgUsers}
      isOwner={user?.globalRole === "OWNER"}
    />
  );
}
