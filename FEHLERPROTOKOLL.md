# Enterprise Vault — Fehlerprotokoll
Erstellt: 19. März 2026 | Getestet als: Alice Owner (Admin, Acme Corp Enterprise)

---

## Legende
- 🔴 **Bug** — Etwas funktioniert nicht wie erwartet
- 🟡 **Fehlt** — Feature ist angefordert aber nicht implementiert
- 🔵 **UX** — Funktioniert, aber Darstellung/Bedienung ist verbesserungswürdig
- ✅ **Erledigt** — Bereits behoben

---

## Offene Punkte

### 🔴 Bug #1 — Copy-Button im Einladungsmodal funktioniert nicht
**Bereich:** Org.-Einstellungen → Benutzer einladen
**Beschreibung:** Nach dem Erstellen eines Einladungslinks wirft der Copy-Button einen `NotAllowedError: Failed to execute 'writeText' on 'Clipboard': Write permission denied`. Der `try/catch` fängt den Fehler nicht ab, weil `navigator.clipboard.writeText()` eine Promise zurückgibt — der Aufruf muss mit `await` erfolgen.
**Auswirkung:** Admin kann den Link nicht per Button kopieren, muss manuell markieren und kopieren.
**Fix:** `handleKopieren` auf `async` umstellen und `await navigator.clipboard.writeText()` + Fallback via `document.execCommand('copy')`.

---

### 🟡 Fehlt #2 — Offene Einladungen: Aktionen fehlen
**Bereich:** Org.-Einstellungen → Tabelle "Offene Einladungen"
**Beschreibung:** Die Einladungsübersicht zeigt Name, E-Mail, Rolle und Ablaufdatum — aber es fehlen Aktions-Buttons pro Zeile: "Link kopieren" und "Erneut senden" (Token erneuern + Ablaufdatum verlängern).
**Auswirkung:** Admin muss den Link nochmal neu erstellen und einen neuen Benutzer-Datensatz anlegen um den Link erneut zu versenden. Altes Token wird nicht ungültig.
**Fix:** Client-Komponente mit Copy-Button + Server Action zum Token-Regenerieren pro Einladungs-Zeile.

---

### 🔴 Bug #3 — Dashboard: Owner sieht "Zugängliche Tresore: 0"
**Bereich:** Dashboard
**Beschreibung:** Der Eigentümer der Organisation sieht auf dem Dashboard "Zugängliche Tresore: 0", obwohl er auf alle Tresore zugreifen kann. Das Dashboard zählt nur explizite `VaultMembership`-Einträge, berücksichtigt aber nicht die globale `OWNER`-Rolle.
**Auswirkung:** Irreführend für Admins — Dashboard vermittelt falschen Eindruck.
**Fix:** Dashboard-Zähler für OWNER/SECURITY_ADMIN anpassen — entweder alle Tresore der Org zählen oder eine Sonderanzeige zeigen.

---

### 🔴 Bug #4 — Audit-Log: Aktions-Codes unleserlich + JSON-Rohdaten sichtbar
**Bereich:** Globales Audit-Protokoll
**Beschreibung:** Die Spalte "AKTION" zeigt interne Codes wie `GROUP_MANAGE` statt lesbarer Texte wie "Gruppe verwaltet". Die "KONTEXT"-Spalte zeigt rohe JSON-Strings wie `{"action":"ADD_MEMBER","memberId":"cmmxmjg5k..."}`.
**Auswirkung:** Audit-Log für nicht-technische Admins nicht lesbar.
**Fix:** Aktion-Codes in lesbare Labels übersetzen (`GROUP_MANAGE` → "Gruppe verwaltet"); Kontext-JSON aufbereitet darstellen.

---

### 🔵 UX #5 — Audit-Log: Tabelle horizontal scrollbar, wichtige Spalten nicht sichtbar
**Bereich:** Globales Audit-Protokoll
**Beschreibung:** Die Tabelle hat 5 Spalten (ZEITPUNKT, BENUTZER, AKTION, ZIEL, KONTEXT) aber der Container ist zu schmal. Standardmäßig sind nur ZEITPUNKT und BENUTZER sichtbar, der Rest ist hinter einem horizontalen Scroll versteckt.
**Auswirkung:** Wichtige Informationen (was wurde getan? an welchem Objekt?) nicht direkt sichtbar.
**Fix:** Tabellen-Layout responsiv gestalten oder unwichtige Spalten ausblenden/zusammenfassen.

---

### 🔵 UX #6 — Gruppen-Verwaltung: Name-Input zu schmal
**Bereich:** Gruppen & Zugriff → Gruppe verwalten
**Beschreibung:** Das Eingabefeld für den Gruppennamen ist sehr schmal und zeigt den Text abgeschnitten ("Marketir" statt "Marketing Team"). Technisch korrekt gespeichert, aber visuell verwirrend.
**Fix:** Input-Feld volle Breite geben, `min-w-0 flex-1` oder `w-full`.

---

### 🟡 Fehlt #7 — Sicherheitsrichtlinien: Keine echten Toggles
**Bereich:** Org.-Einstellungen → Sicherheitsrichtlinien
**Beschreibung:** Die Richtlinien (2FA erzwingen, Export verhindern, Audit-Protokoll aktivieren, Session-Timeout) sind rein statische Anzeige-Labels. Es gibt keine Möglichkeit diese tatsächlich ein- oder auszuschalten.
**Auswirkung:** Wirkt wie fertige Funktion, ist aber nur Dekoration.
**Fix:** Toggle-Buttons mit Server Action zum Speichern der Einstellung in der DB (Org-Einstellungsfeld oder eigene Settings-Tabelle).

---

### 🟡 Fehlt #8 — Tresor direkt aus Gruppen-Verwaltung zuweisen
**Bereich:** Gruppen & Zugriff → Gruppe verwalten
**Beschreibung:** Auf der Gruppen-Verwaltungsseite kann man Mitglieder verwalten, aber keinen Tresor direkt zuweisen. Man muss dazu über Tresore & Geheimnisse → Tresor → "Zugriff verwalten" gehen und dort die Gruppe hinzufügen.
**Auswirkung:** Umständlicher Workflow — Admin muss zwischen zwei Bereichen hin- und herwechseln.
**Fix:** Abschnitt "Zugewiesene Tresore" auf der Gruppen-Verwaltungsseite hinzufügen.

---

### 🟡 Fehlt #9 — Benutzer-Rolle nachträglich ändern
**Bereich:** Org.-Einstellungen → Benutzerverwaltung
**Beschreibung:** In der Benutzerliste gibt es keine Möglichkeit die Rolle eines bestehenden Nutzers zu ändern (z.B. MEMBER → SECURITY_ADMIN). Nur Einladen und Löschen ist möglich.
**Fix:** Rollen-Dropdown pro Benutzerzeile mit Server Action.

---

### 🔵 UX #10 — "Zugriff verwalten"-Button im Tresor visuell abgeschnitten
**Bereich:** Tresore & Geheimnisse → Tresor-Detailseite
**Beschreibung:** Der "Zugriff verwalten"-Button wird rechts oben vom Seitenrand überschnitten ("Zugriff verw..." sichtbar). Auf kleinerem Viewport komplett unsichtbar.
**Fix:** Button-Bereich responsiv gestalten, ggf. in ein Dropdown/Menü verlagern.

---

### 🔴 Bug #11 — Schema-Konflikt: SQLite lokal vs. PostgreSQL Produktion
**Bereich:** Infrastruktur / Deployment
**Beschreibung:** Das lokale `.env` nutzt `DATABASE_URL="file:./dev.db"` (SQLite), das Coolify-Deployment erwartet eine PostgreSQL-URL. Da Prisma `provider` im Schema hartkodiert ist, muss vor dem Commit immer zwischen `sqlite` und `postgresql` gewechselt werden.
**Auswirkung:** Fehleranfälliger manueller Schritt vor jedem Deploy. Aktuell liegt `sqlite` im Schema committed.
**Fix:** Entweder PostgreSQL auch lokal (Docker Compose), oder zwei Schema-Dateien mit Build-Script, oder Prisma-Migrations-Setup korrekt trennen.

---

## Bereits funktionierend ✅

| Funktion | Status |
|---|---|
| Login / Logout | ✅ |
| Tresor erstellen | ✅ |
| Geheimnis erstellen (AES-256-GCM verschlüsselt) | ✅ |
| Geheimnis anzeigen (entschlüsseln) | ✅ |
| Geheimnis bearbeiten | ✅ |
| Gruppe erstellen | ✅ |
| Mitglied zu Gruppe hinzufügen / entfernen | ✅ |
| Benutzer einladen (Token-Link) | ✅ |
| Einladungsübersicht in Settings | ✅ |
| Vault-Mitglieder (User/Gruppe) hinzufügen | ✅ |
| Vault-Mitglieder entfernen | ✅ |
| Benutzer löschen | ✅ |
| Audit-Protokoll (Einträge vorhanden) | ✅ |
| Audit-Protokoll Filter (Alle / Geheimnisse / Tresore) | ✅ |
| Organisations-Isolation (nur eigene Org sichtbar) | ✅ |
| Persönlicher Tresor | ✅ |
| RBAC (Berechtigungen pro Vault) | ✅ |

---

## Priorisierung

| Prio | Nr. | Aufwand |
|---|---|---|
| 1 | #1 Copy-Button fix | Klein |
| 2 | #2 Einladungs-Aktionen | Mittel |
| 3 | #3 Dashboard Owner Tresore | Klein |
| 4 | #4 Audit-Log lesbar | Mittel |
| 5 | #9 Rolle ändern | Mittel |
| 6 | #7 Sicherheitsrichtlinien | Groß |
| 7 | #8 Tresor aus Gruppe zuweisen | Mittel |
| 8 | #5 Audit-Log Tabelle | Klein |
| 9 | #6 Input-Feld Breite | Klein |
| 10 | #10 Button-Überschneidung | Klein |
| 11 | #11 Schema-Konflikt | Groß |
