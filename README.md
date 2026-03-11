# Enterprise Vault Prototype

An enterprise password manager prototype demonstrating robust Role-Based Access Control (RBAC), layered security, and group-first permission models. Inspired by the architectural patterns of modern enterprise managers like 1Password and Keeper.

## Core Features
1. **Separated Roles & Permissions**: Organization "Roles" (Owner, Security Admin) are decoupled from Vault "Permissions" (Use, Reveal, Edit, Manage).
2. **Layered Access Model**: `User -> Group -> Vault -> Permission`
3. **Least Privilege**: Features like "Manage Members" do not implicitly grant "Reveal Secrets".
4. **Comprehensive Audit Logging**: Immutable logs of who revealed what secret, and who modified access groups, restricted to Admins.
5. **Envelope Encryption Pattern**: (Simulated for MVP) Secrets are encrypted using AES-256-GCM before writing to the database.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Database**: SQLite (via Prisma ORM) - *Downgraded from Postgres for local prototype portability*
- **Auth**: NextAuth.js (Credentials Provider with Argon2id)

## Getting Started

### 1. Configure Environment
A `.env` file is already created:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="fL6Yd7e9jE6fR8tG0qS1zM3vA2bC5dE4h"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Install & Seed
```bash
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts
All accounts use the password: `password123`

- `owner@acme.inc`: (Global Owner) - Full visibility and management.
- `security@acme.inc`: (Security Admin) - Manage users/logs, but cannot reveal passwords without explicit vault grants.
- `hr@acme.inc`: (Member) - Edit/Reveal access to HR Vault only.
- `engineer@acme.inc`: (Member) - Reveal dev secrets, but "Use-only" (No reveal) for production secrets.
- `contractor@acme.inc`: (Member) - High restriction, "Use-only" on shared vaults.
- `it@acme.inc`: (Member) - Can manage vault memberships, but CANNOT reveal the actual passwords.
- `guest@external.com`: (Guest) - Direct, restricted user assignment to a single drop vault.

## Security Assumptions & Production Hardening Checklist
*This is a prototype MVP. For a true production application handling sensitive data, the following must be implemented:*

1. **True Zero Knowledge Architecture**: 
   - Currently, encryption happens server-side using a single master `.env` key to simulate envelope encryption.
   - **Production**: Encryption/decryption must happen entirely in the client-side browser/app using WebCrypto. The server should never see plaintext passwords or Data Encryption Keys.
2. **Database Engine**: Migrate from local SQLite to a robust PostgreSQL cluster (Prisma config easily supports this).
3. **NextAuth Production**: Replace the local Credentials/Argon2id provider with an enterprise Identity Provider via SAML/OIDC (Okta, Entra ID) to support SCIM provisioning and immediate active session revocation.
4. **Key Rotation**: Implement key rotation logic for Vault Keys and Data Keys.
5. **Rate Limiting & WAF**: Add strict rate-limiting on login and secret revelation endpoints to prevent brute forcing and scraping.
