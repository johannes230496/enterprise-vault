import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'
import crypto from 'crypto'

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })

// Dummy encryption for seed secrets
const DEMO_MASTER_KEY = process.env.NEXTAUTH_SECRET || "fL6Yd7e9jE6fR8tG0qS1zM3vA2bC5dE4h"
const derivedKey = crypto.createHash('sha256').update(String(DEMO_MASTER_KEY)).digest('base64').substring(0, 32);

function encryptMock(text: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

async function main() {
  console.log('Clearing old data...')
  await prisma.auditEvent.deleteMany()
  await prisma.temporaryAccessGrant.deleteMany()
  await prisma.secretVersion.deleteMany()
  await prisma.secret.deleteMany()
  await prisma.vaultMembership.deleteMany()
  await prisma.groupMembership.deleteMany()
  await prisma.vault.deleteMany()
  await prisma.group.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  console.log('Seeding new demo data...')
  
  // 1. Organization
  const org = await prisma.organization.create({
    data: { name: 'Acme Corp Enterprise' }
  })

  // 2. Hash default password
  const defaultPassword = await argon2.hash('password123')

  // 3. Create Users
  // Users: Owner, HR Manager, Finance User, Engineer, Contractor, IT Support, Guest
  const users = {
    owner: await prisma.user.create({ data: { name: 'Alice Owner', email: 'owner@acme.inc', passwordHash: defaultPassword, globalRole: 'OWNER', organizationId: org.id } }),
    secAdmin: await prisma.user.create({ data: { name: 'Bob SecAdmin', email: 'security@acme.inc', passwordHash: defaultPassword, globalRole: 'SECURITY_ADMIN', organizationId: org.id } }),
    hr: await prisma.user.create({ data: { name: 'Carol HR', email: 'hr@acme.inc', passwordHash: defaultPassword, globalRole: 'MEMBER', organizationId: org.id } }),
    finance: await prisma.user.create({ data: { name: 'Dave Finance', email: 'finance@acme.inc', passwordHash: defaultPassword, globalRole: 'MEMBER', organizationId: org.id } }),
    engineer: await prisma.user.create({ data: { name: 'Eve Engineer', email: 'engineer@acme.inc', passwordHash: defaultPassword, globalRole: 'MEMBER', organizationId: org.id } }),
    contractor: await prisma.user.create({ data: { name: 'Frank Contractor', email: 'contractor@acme.inc', passwordHash: defaultPassword, globalRole: 'MEMBER', organizationId: org.id } }),
    it: await prisma.user.create({ data: { name: 'Grace IT', email: 'it@acme.inc', passwordHash: defaultPassword, globalRole: 'MEMBER', organizationId: org.id } }),
    guest: await prisma.user.create({ data: { name: 'Heidi Guest', email: 'guest@external.com', passwordHash: defaultPassword, globalRole: 'GUEST', organizationId: org.id } }),
  }

  // 4. Create Groups
  const groups = {
    hr: await prisma.group.create({ data: { name: 'Human Resources', organizationId: org.id } }),
    finance: await prisma.group.create({ data: { name: 'Finance Team', organizationId: org.id } }),
    engineering: await prisma.group.create({ data: { name: 'Engineering', organizationId: org.id } }),
    contractors: await prisma.group.create({ data: { name: 'Contractors', organizationId: org.id } }),
    itSupport: await prisma.group.create({ data: { name: 'IT Support', organizationId: org.id } }),
  }

  // 5. Group Memberships
  await prisma.groupMembership.create({ data: { userId: users.hr.id, groupId: groups.hr.id } })
  await prisma.groupMembership.create({ data: { userId: users.finance.id, groupId: groups.finance.id } })
  await prisma.groupMembership.create({ data: { userId: users.engineer.id, groupId: groups.engineering.id } })
  await prisma.groupMembership.create({ data: { userId: users.contractor.id, groupId: groups.contractors.id } })
  await prisma.groupMembership.create({ data: { userId: users.it.id, groupId: groups.itSupport.id } })

  // 6. Vaults
  const vaults = {
    hr: await prisma.vault.create({ data: { name: 'HR Records', description: 'Sensitive employee info', organizationId: org.id } }),
    finance: await prisma.vault.create({ data: { name: 'Financial Accounts', description: 'Bank and billing accounts', organizationId: org.id } }),
    engineering: await prisma.vault.create({ data: { name: 'Engineering Secrets', description: 'AWS, DB, APIs', organizationId: org.id } }),
    production: await prisma.vault.create({ data: { name: 'Production Credentials', description: 'Live system access', organizationId: org.id } }),
    shared: await prisma.vault.create({ data: { name: 'Shared Services', description: 'Common office logins', organizationId: org.id } }),
    guestVault: await prisma.vault.create({ data: { name: 'Guest Drop', description: 'Temporary external sharing', organizationId: org.id } })
  }

  // 7. Vault Memberships (The core of RBAC)
  // HR can manage and reveal HR vault
  await prisma.vaultMembership.create({
    data: { vaultId: vaults.hr.id, groupId: groups.hr.id, permissions: JSON.stringify({ use: true, reveal: true, edit: true, delete: false, share: false, export: false, manage: true }) }
  })

  // Finance can manage Finance vault
  await prisma.vaultMembership.create({
    data: { vaultId: vaults.finance.id, groupId: groups.finance.id, permissions: JSON.stringify({ use: true, reveal: true, edit: true, delete: false, share: false, export: true, manage: true }) }
  })

  // Engineers can reveal Engineering vault, and use Production vault
  await prisma.vaultMembership.create({
    data: { vaultId: vaults.engineering.id, groupId: groups.engineering.id, permissions: JSON.stringify({ use: true, reveal: true, edit: true, delete: false, share: false, export: false, manage: false }) }
  })
  await prisma.vaultMembership.create({
    data: { vaultId: vaults.production.id, groupId: groups.engineering.id, permissions: JSON.stringify({ use: true, reveal: false, edit: false, delete: false, share: false, export: false, manage: false }) }
  })

  // Contractors can use Shared vault, but cannot reveal
  await prisma.vaultMembership.create({
    data: { vaultId: vaults.shared.id, groupId: groups.contractors.id, permissions: JSON.stringify({ use: true, reveal: false, edit: false, delete: false, share: false, export: false, manage: false }) }
  })

  // IT Support can manage Memberships but cannot reveal actual passwords!
  await prisma.vaultMembership.create({
    data: { vaultId: vaults.shared.id, groupId: groups.itSupport.id, permissions: JSON.stringify({ use: false, reveal: false, edit: false, delete: false, share: false, export: false, manage: true }) }
  })
  await prisma.vaultMembership.create({
    data: { vaultId: vaults.engineering.id, groupId: groups.itSupport.id, permissions: JSON.stringify({ use: false, reveal: false, edit: false, delete: false, share: false, export: false, manage: true }) }
  })

  // Guest gets direct user assignment to Guest Vault (temporary)
  await prisma.vaultMembership.create({
    data: { vaultId: vaults.guestVault.id, userId: users.guest.id, permissions: JSON.stringify({ use: true, reveal: true, edit: false, delete: false, share: false, export: false, manage: false }) }
  })

  // 8. Secrets (Encrypted paylods)
  const mkSecret = (name: string, value: string, vault: any, author: any) => {
    const enc = encryptMock(value);
    return prisma.secret.create({
      data: {
        name,
        contentType: 'LOGIN',
        encryptedData: enc.encryptedData,
        iv: enc.iv,
        authTag: enc.authTag,
        vaultId: vault.id,
        createdById: author.id
      }
    })
  }

  await mkSecret('Workday Login', 'super-secret-hr-pass', vaults.hr, users.owner)
  await mkSecret('Stripe API Key', 'sk_live_123456789', vaults.finance, users.owner)
  await mkSecret('AWS Root', 'aws-root-password-prod', vaults.production, users.owner)
  await mkSecret('AWS Dev', 'aws-dev-password', vaults.engineering, users.owner)
  await mkSecret('Office WiFi', 'welcome2acme', vaults.shared, users.it)
  await mkSecret('Partner FTP', 'ftp-password-123', vaults.guestVault, users.owner)

  console.log('✅ Demo data seeded successfully!')
  console.log('Login credentials (all use password123)')
  console.log('- owner@acme.inc     (Global Owner)')
  console.log('- security@acme.inc  (Security Admin)')
  console.log('- engineer@acme.inc  (Engineer - use/reveal dev, use-only prod)')
  console.log('- contractor@acme.inc(Contractor - use-only shared)')
  console.log('- it@acme.inc        (IT - manage vaults, no reveal)')
  console.log('- guest@external.com (Guest - direct assigned to single vault)')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
