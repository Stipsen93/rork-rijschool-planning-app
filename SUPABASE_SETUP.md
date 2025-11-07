# DrivePlan Supabase Setup Instructies

Deze handleiding helpt je om de Supabase database op te zetten voor je DrivePlan app.

## Stap 1: Supabase Project Configuratie

1. **Ga naar je Supabase project**: https://gqipssfphzysaehwefga.supabase.co
2. **Klik op SQL Editor** in het linkermenu

## Stap 2: Database Schema Aanmaken

1. **Kopieer de volledige inhoud** van `supabase-schema.sql`
2. **Plak deze in de SQL Editor** van Supabase
3. **Klik op "Run"** om het schema aan te maken

Dit maakt aan:
- ✅ User roles (instructor/student)
- ✅ Profiles tabel
- ✅ Instructor profiles tabel
- ✅ Student profiles tabel  
- ✅ Lessons tabel (gedeeld tussen instructors en studenten)
- ✅ Packages tabel
- ✅ Vehicles tabel
- ✅ Row Level Security (RLS) policies
- ✅ Automatische triggers
- ✅ Indexen voor performance

## Stap 3: Demo Accounts Aanmaken (Optioneel)

### 3a. Maak Auth Users aan

1. **Ga naar Authentication → Users** in Supabase Dashboard
2. **Klik op "Add user"** en maak deze accounts aan:

   **Instructeur Account:**
   - Email: `instructor@example.com`
   - Password: `password123`
   - Email Confirm: ✅ (vink aan)
   - Auto Confirm User: ✅ (vink aan)

   **Student 1 Account:**
   - Email: `student1@example.com`
   - Password: `password123`
   - Email Confirm: ✅ (vink aan)
   - Auto Confirm User: ✅ (vink aan)

   **Student 2 Account:**
   - Email: `student2@example.com`
   - Password: `password123`
   - Email Confirm: ✅ (vink aan)
   - Auto Confirm User: ✅ (vink aan)

### 3b. Voeg Demo Data Toe

1. **Ga terug naar SQL Editor**
2. **Kopieer het demo data script** (het staat als commentaar onderaan `supabase-schema.sql`, tussen `/*` en `*/`)
3. **Plak en run het script** in SQL Editor

Dit voegt toe:
- ✅ Complete profielen voor instructor
- ✅ Complete profielen voor studenten
- ✅ Demo vehicle (Toyota Yaris)
- ✅ Demo lessen (scheduled en completed)
- ✅ Skills progress data

## Stap 4: Verifieer de Setup

### Check Tables

```sql
-- Verifieer dat alle tabellen zijn aangemaakt
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Je zou moeten zien:
- ✅ profiles
- ✅ instructor_profiles
- ✅ student_profiles
- ✅ lessons
- ✅ packages
- ✅ vehicles

### Check Demo Users

```sql
-- Verifieer demo profielen
SELECT email, full_name, role, is_active 
FROM profiles;
```

### Check Demo Lessons

```sql
-- Verifieer demo lessen
SELECT 
  l.title,
  l.lesson_type,
  l.start_time,
  l.status,
  i.full_name as instructor,
  s.full_name as student
FROM lessons l
JOIN profiles i ON l.instructor_id = i.id
JOIN profiles s ON l.student_id = s.id;
```

## Stap 5: Test de App

### Test Instructeur Login

1. Open de app
2. Log in met: `instructor@example.com` / `password123`
3. Je zou naar het **Instructeur Overview** moeten gaan
4. Controleer of je:
   - ✅ Lessen ziet in de agenda
   - ✅ Student profielen kunt bekijken
   - ✅ Nieuwe lessen kunt aanmaken

### Test Student Login

1. Log uit
2. Log in met: `student1@example.com` / `password123`
3. Je zou naar het **Student Overview** moeten gaan
4. Controleer of je:
   - ✅ Je volgende les ziet
   - ✅ Progress stats ziet
   - ✅ Recent activity ziet

## Stap 6: Test Registratie

### Test Nieuwe Instructeur

1. Log uit
2. Klik op "Registreren"
3. Selecteer "Instructeur"
4. Vul formulier in met:
   - Naam
   - Email
   - Telefoon
   - Geboortedatum
   - WRM Pasnummer
   - Rijschool naam
   - Wachtwoord
5. Accepteer voorwaarden
6. Klik "Account aanmaken"
7. ✅ Je zou een succesbericht moeten zien
8. ✅ Je zou automatisch ingelogd moeten zijn

### Test Nieuwe Student

1. Log uit
2. Klik op "Registreren"
3. Selecteer "Student"
4. Vul formulier in
5. Accepteer voorwaarden
6. Klik "Account aanmaken"
7. ✅ Je zou een succesbericht moeten zien
8. ✅ Je zou naar student dashboard moeten gaan

## Troubleshooting

### Error: "relation does not exist"

- ✅ Run het schema script opnieuw
- ✅ Check of je in de juiste Supabase project zit

### Error: "permission denied"

- ✅ Check RLS policies in SQL Editor:
  ```sql
  SELECT tablename, policyname 
  FROM pg_policies 
  WHERE schemaname = 'public';
  ```

### Demo users werken niet

- ✅ Check of auth users zijn aangemaakt in Authentication → Users
- ✅ Check of profiles zijn gekoppeld:
  ```sql
  SELECT 
    u.email,
    p.full_name,
    p.role
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id;
  ```

### Lessons verschijnen niet

- ✅ Check of de foreign keys correct zijn:
  ```sql
  SELECT 
    l.id,
    l.instructor_id,
    l.student_id,
    i.email as instructor_email,
    s.email as student_email
  FROM lessons l
  LEFT JOIN profiles i ON l.instructor_id = i.id
  LEFT JOIN profiles s ON l.student_id = s.id;
  ```

## Database Structuur Overzicht

```
auth.users (Supabase Auth)
  └─> profiles (Base user info)
       ├─> instructor_profiles (Instructor specific)
       ├─> student_profiles (Student specific)
       ├─> lessons (Shared between instructor & student)
       ├─> packages (Instructor's packages)
       └─> vehicles (Instructor's vehicles)
```

## Row Level Security (RLS) Overzicht

- **Profiles**: Users kunnen hun eigen profiel zien en bewerken
- **Instructor Profiles**: Instructors zien eigen profiel, students zien hun instructor
- **Student Profiles**: Students zien eigen profiel, instructors zien hun students
- **Lessons**: Beide partijen kunnen hun eigen lessen zien en bewerken
- **Packages**: Iedereen kan actieve packages zien, instructors beheren eigen packages
- **Vehicles**: Instructors beheren eigen voertuigen, students zien instructor's voertuigen

## Belangrijke Notities

1. **Automatische Profile Creatie**: Wanneer een nieuwe user zich registreert via Supabase Auth, wordt automatisch een profiel aangemaakt via de `handle_new_user()` trigger.

2. **Role-based Access**: De app gebruikt het `role` veld in profiles om te bepalen welke omgeving te tonen (instructor vs student).

3. **Shared Lessons**: Lessons worden gedeeld tussen instructors en students via foreign keys. Beide partijen kunnen de lesson data zien en bewerken binnen hun permissions.

4. **Data Privacy**: RLS policies zorgen ervoor dat users alleen data kunnen zien die relevant is voor hun role.

## Support

Als je problemen ondervindt:
1. Check de browser console voor errors
2. Check Supabase logs in Dashboard → Logs
3. Verifieer dat alle environment variabelen correct zijn ingesteld

---

✅ **Setup compleet!** Je app is nu klaar voor gebruik met Supabase backend.
