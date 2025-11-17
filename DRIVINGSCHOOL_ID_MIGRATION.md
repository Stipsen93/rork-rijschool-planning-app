# Drivingschool ID Migration

## Overzicht
De applicatie is bijgewerkt om `drivingschool_id` (foreign key) te gebruiken in plaats van `drivingschool_name` (string) in de profiles tabel.

## Wijzigingen

### 1. Database Schema (`drivingschool-id-migration.sql`)
- **Nieuwe tabel**: `drivingschools` met id, name, address, phone, email, website, is_active
- **Profiles tabel**: Nieuwe kolom `drivingschool_id` (UUID foreign key naar drivingschools.id)
- **Data migratie**: Automatische migratie van bestaande `drivingschool_name` naar `drivingschool_id`
- **Trigger update**: `handle_new_user()` functie bijgewerkt om `drivingschool_id` te verwerken
- **Default rijscholen**: 5 voorbeeldrijscholen toegevoegd

### 2. TypeScript Types (`types/supabase.ts`)
- **Profiles type**: Toegevoegd `drivingschool_id: string | null`
- **Nieuwe tabel type**: `drivingschools` met alle velden

### 3. Backend Routes

#### Nieuwe route: `backend/trpc/routes/drivingschools/list/route.ts`
- Haalt lijst van actieve rijscholen op (id + name)
- Gesorteerd op naam
- Toegevoegd aan `app-router.ts` als `drivingschools.list`

#### Bijgewerkte route: `backend/trpc/routes/auth/signup/route.ts`
- Nieuwe input parameter: `drivingschoolId` (optioneel, UUID)
- Validatie: alleen valide UUID's
- Wordt doorgegeven aan Supabase in user metadata

### 4. Frontend Updates

#### `app/register.tsx`
- **Verwijderd**: TextInput voor schoolName
- **Toegevoegd**: 
  - Modal picker voor rijschool selectie
  - Query voor het ophalen van rijscholen via `trpc.drivingschools.list.useQuery()`
  - State: `selectedDrivingschool` en `showDrivingschoolPicker`
  - Validatie: rijschool moet geselecteerd zijn
  - Geselecteerde rijschool.id wordt meegegeven aan signup functie

#### `components/auth/AuthStore.tsx`
- Signup functie uitgebreid met `drivingschoolId?: string` parameter
- Wordt toegevoegd aan user metadata als `drivingschool_id`

## Installatie Instructies

### Stap 1: Run SQL migratie
Voer het bestand `drivingschool-id-migration.sql` uit in je Supabase SQL Editor:
```sql
-- Dit script doet:
-- 1. Maakt drivingschools tabel aan
-- 2. Voegt drivingschool_id kolom toe aan profiles
-- 3. Migreert bestaande data automatisch
-- 4. Verwijdert oude drivingschool_name kolom
-- 5. Update de handle_new_user trigger
```

### Stap 2: Restart de applicatie
De TypeScript types en backend routes zijn automatisch beschikbaar.

## Gebruik in de UI

### Voor gebruikers (registratie):
1. Gebruiker opent registratiepagina
2. Klikt op "Selecteer je rijschool"
3. Modal opent met lijst van beschikbare rijscholen
4. Selecteert een rijschool
5. Bij signup wordt de rijschool ID opgeslagen in profile

### Voor developers (query):
```typescript
// Haal profiel op met rijschool informatie
const { data } = await supabase
  .from('profiles')
  .select(`
    *,
    drivingschool:drivingschools(id, name)
  `)
  .eq('id', userId)
  .single();

// Result:
// {
//   id: "...",
//   email: "...",
//   drivingschool_id: "uuid",
//   drivingschool: { id: "uuid", name: "VerkeersPro Rijschool" }
// }
```

## Voordelen

1. **Data integriteit**: Foreign key constraints voorkomen ongeldige data
2. **Flexibiliteit**: Rijschool informatie kan centraal bijgewerkt worden
3. **Efficiëntie**: Kleinere database footprint (UUID vs. full text)
4. **Uitbreidbaarheid**: Eenvoudig extra rijschool informatie toevoegen (adres, telefoon, etc.)
5. **Consistency**: Geen type-fouten in rijschool namen

## Testen

Test de volgende scenario's:
1. **Nieuwe registratie**: Gebruiker kan rijschool selecteren
2. **Bestaande gebruikers**: Data blijft intact na migratie
3. **Dropdown**: Alle actieve rijscholen worden getoond
4. **Validatie**: Registratie faalt zonder rijschool selectie
5. **Web + Mobile**: Modal werkt op beide platforms
