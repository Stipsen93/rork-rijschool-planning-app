# Instructeur Nummer Fix

## Probleem
1. Instructeurs hadden geen uniek 6-cijferig instructeur nummer
2. Professionele informatie werd gereset bij het klikken op "Bewerken"
3. Wijzigingen werden niet correct gesynct met Supabase

## Oplossing

### 1. SQL Migratie (`fix-instructor-number-generation.sql`)
Dit bestand voert de volgende acties uit:
- Creëert een functie `generate_instructor_number()` die unieke 6-cijferige nummers genereert
- Update alle bestaande instructeurs zonder nummer met een uniek nummer
- Voegt een trigger toe die automatisch een nummer genereert bij het aanmaken van een nieuw instructeur profiel
- Zorgt ervoor dat het `instructor_number` veld NOT NULL en UNIQUE is

### 2. Frontend Aanpassingen

#### Profile Screen (`app/(tabs)/settings/profile.tsx`)
- Het instructeur nummer veld is nu altijd disabled (onbewerkbaar)
- Het profiel wordt niet meer gereset wanneer je op "Bewerken" klikt
- Toont "Wordt gegenereerd..." als er nog geen nummer is

#### Sync Route (`backend/trpc/routes/instructor/sync-settings/route.ts`)
- Het instructeur nummer kan niet meer worden gewijzigd vanuit de frontend
- Alleen de database trigger kan het nummer genereren en beheren
- Dit voorkomt dat het nummer per ongeluk wordt overschreven

## Instructies voor uitvoeren

### Stap 1: SQL Migratie uitvoeren
Voer het bestand `fix-instructor-number-generation.sql` uit in je Supabase SQL Editor:

1. Ga naar je Supabase project
2. Klik op "SQL Editor" in het linker menu
3. Klik op "New Query"
4. Kopieer en plak de inhoud van `fix-instructor-number-generation.sql`
5. Klik op "Run" om de migratie uit te voeren

### Stap 2: Test de wijzigingen
1. Log in als instructeur
2. Ga naar Profiel in Instellingen
3. Controleer of het instructeur nummer zichtbaar is (6 cijfers)
4. Klik op "Bewerken"
5. Wijzig professionele informatie (bijv. jaren ervaring)
6. Klik op "Opslaan"
7. Controleer of de wijzigingen zijn opgeslagen en niet zijn gereset
8. Vernieuw de pagina en controleer of alle informatie nog correct is

## Resultaat
- ✅ Elke instructeur heeft een uniek 6-cijferig instructeur nummer
- ✅ Het nummer is zichtbaar in het profiel maar onbewerkbaar
- ✅ Professionele informatie wordt correct gesynct met Supabase
- ✅ Wijzigingen worden niet meer gereset bij het bewerken
