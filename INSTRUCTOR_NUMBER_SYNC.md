# Instructeursnummer Synchronisatie Fix

## Probleem
Het instructeursnummer werd alleen lokaal in AsyncStorage opgeslagen en niet in Supabase. 
Hierdoor zag je verschillende nummers op verschillende apparaten (web vs mobiel).

## Oplossing
Het instructeursnummer wordt nu opgeslagen in de Supabase database en automatisch gesynchroniseerd naar alle apparaten.

## Installatie Stappen

### 1. Voer de database migratie uit

Open je Supabase SQL Editor en voer het bestand `instructor-number-migration.sql` uit:

```sql
-- Dit bestand voegt het volgende toe:
-- 1. instructor_number kolom aan instructor_profiles tabel
-- 2. Functie om unieke 7-cijferige nummers te genereren
-- 3. Trigger om automatisch een nummer toe te wijzen bij het aanmaken van een instructeur
-- 4. Unique constraint om duplicaten te voorkomen
-- 5. Index voor snelle lookups
```

### 2. Verificatie

Na het uitvoeren van de migratie:

1. Check of de kolom is toegevoegd:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'instructor_profiles' 
AND column_name = 'instructor_number';
```

2. Check of bestaande instructeurs een nummer hebben gekregen:
```sql
SELECT user_id, instructor_number 
FROM instructor_profiles;
```

3. Test de trigger door een nieuwe instructeur aan te maken (via de app)

### 3. App Updates

De volgende bestanden zijn geüpdatet:

- `types/supabase.ts` - Toegevoegd instructor_number veld
- `components/settings/ProfileStore.tsx` - Sync met backend voor instructor_number
- `backend/trpc/routes/auth/me/route.ts` - Retourneert nu instructor_number

### 4. Gebruik

Het instructeursnummer wordt nu:
- Automatisch gegenereerd bij het aanmaken van een nieuwe instructeur
- Opgeslagen in Supabase (single source of truth)
- Gesynchroniseerd naar AsyncStorage voor offline gebruik
- Consistent getoond op alle apparaten (web, iOS, Android)

Leerlingen kunnen instructeurs nu zoeken op dit unieke 7-cijferige nummer.

## Testing

1. Log in als instructeur op web
2. Noteer het instructeursnummer
3. Log in als dezelfde instructeur op mobiel
4. Verificeer dat het nummer hetzelfde is
