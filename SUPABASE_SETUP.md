# Supabase Backend Setup voor DrivePlan

Deze app gebruikt Supabase als backend voor authenticatie en database. Volg deze stappen om de backend volledig in te stellen.

## 1. Database Schema Installeren

1. Ga naar je Supabase project dashboard: https://supabase.com/dashboard
2. Navigeer naar de **SQL Editor** in het linkermenu
3. Klik op **New Query**
4. Kopieer de volledige inhoud van het `supabase-schema.sql` bestand
5. Plak het in de SQL Editor
6. Klik op **Run** om het schema te installeren

Dit creëert alle benodigde tabellen, policies, en indexes voor de app.

## 2. Demo Accounts Aanmaken

Na het installeren van het schema, moet je de demo accounts aanmaken:

### In Supabase Dashboard:

1. Ga naar **Authentication** → **Users** in het linkermenu
2. Klik op **Add user** → **Create new user**

#### Instructeur Account
- Email: `instructor@example.com`
- Password: `password123`
- Confirm password: `password123`
- ✅ Auto Confirm User (aanvinken)

#### Student 1 Account
- Email: `student1@example.com`
- Password: `password123`
- Confirm password: `password123`
- ✅ Auto Confirm User (aanvinken)

#### Student 2 Account
- Email: `student2@example.com`
- Password: `password123`
- Confirm password: `password123`
- ✅ Auto Confirm User (aanvinken)

### Profielen Aanmaken via SQL

3. Ga terug naar de **SQL Editor**
4. Voer de volgende SQL uit om de profielen aan te maken:

\`\`\`sql
-- Vervang de UUIDs hieronder met de echte user IDs uit je Supabase Auth Users tabel
-- Je kunt deze vinden in Authentication → Users

-- Instructeur profiel
INSERT INTO profiles (id, email, full_name, role, phone, is_active)
VALUES (
  'INSTRUCTOR_USER_ID_HIER',  -- Vervang met echte UUID
  'instructor@example.com',
  'Jan van der Berg',
  'instructor',
  '+31612345678',
  true
);

INSERT INTO instructor_profiles (user_id, company_name, rating, total_lessons, years_experience)
VALUES (
  'INSTRUCTOR_USER_ID_HIER',  -- Vervang met echte UUID
  'Rijschool Van der Berg',
  4.8,
  150,
  10
);

-- Student 1 profiel
INSERT INTO profiles (id, email, full_name, role, phone, is_active)
VALUES (
  'STUDENT1_USER_ID_HIER',  -- Vervang met echte UUID
  'student1@example.com',
  'Emma Jansen',
  'student',
  '+31623456789',
  true
);

INSERT INTO student_profiles (user_id, lesson_streak, level, total_lessons_completed, hours_driven, overall_progress, instructor_id)
VALUES (
  'STUDENT1_USER_ID_HIER',  -- Vervang met echte UUID
  7,
  'Gevorderd',
  45,
  67.5,
  0.72,
  'INSTRUCTOR_USER_ID_HIER'  -- Vervang met instructeur UUID
);

-- Student 2 profiel
INSERT INTO profiles (id, email, full_name, role, phone, is_active)
VALUES (
  'STUDENT2_USER_ID_HIER',  -- Vervang met echte UUID
  'student2@example.com',
  'Lucas de Vries',
  'student',
  '+31634567890',
  true
);

INSERT INTO student_profiles (user_id, lesson_streak, level, total_lessons_completed, hours_driven, overall_progress, instructor_id)
VALUES (
  'STUDENT2_USER_ID_HIER',  -- Vervang met echte UUID
  3,
  'Beginner',
  15,
  22.5,
  0.35,
  'INSTRUCTOR_USER_ID_HIER'  -- Vervang met instructeur UUID
);
\`\`\`

## 3. App Configuratie Controleren

De app is al geconfigureerd met je Supabase credentials:
- **Project URL**: `https://gqipssfphzysaehwefga.supabase.co`
- **Anon Key**: (al ingesteld in de code)

Deze zijn al ingesteld in:
- `lib/supabase.ts`
- `backend/trpc/create-context.ts`

## 4. Testen

Start de app en test het inloggen met de demo accounts:

\`\`\`bash
npm start
# of
bun start
\`\`\`

### Test Scenarios:

1. **Instructeur login**:
   - Email: `instructor@example.com`
   - Password: `password123`
   - Verwacht: Navigeert naar instructeur dashboard

2. **Student login**:
   - Email: `student1@example.com`
   - Password: `password123`
   - Verwacht: Navigeert naar student dashboard

3. **Uitloggen**:
   - Ga naar Instellingen/Profiel
   - Klik op "Uitloggen"
   - Verwacht: Terug naar login scherm

## Database Structuur

### Belangrijkste Tabellen:

- **profiles**: Basis gebruikersprofielen (extends auth.users)
- **instructor_profiles**: Extra informatie voor instructeurs
- **student_profiles**: Extra informatie voor studenten
- **lessons**: Gedeelde lessen tussen instructeurs en studenten
- **packages**: Lespakketten aangeboden door instructeurs
- **vehicles**: Voertuigen van instructeurs

### Row Level Security (RLS)

De database gebruikt RLS policies om ervoor te zorgen dat:
- Gebruikers alleen hun eigen data kunnen zien/bewerken
- Studenten kunnen hun instructeur's informatie zien
- Instructeurs kunnen hun studenten's informatie zien
- Lessen zijn zichtbaar voor beide partijen (instructeur en student)

## API Endpoints

De app heeft de volgende tRPC endpoints:

### Authenticatie:
- `auth.signup` - Registreer nieuwe gebruiker
- `auth.login` - Login gebruiker
- `auth.logout` - Logout gebruiker
- `auth.me` - Haal huidige gebruiker op

### Lessen:
- `lessons.create` - Maak nieuwe les
- `lessons.list` - Haal lessen op
- `lessons.update` - Update les
- `lessons.delete` - Verwijder les

## Troubleshooting

### "Profile not found" bij login
- Controleer of je de profielen hebt aangemaakt in de `profiles` tabel
- Controleer of de user IDs overeenkomen met die in `auth.users`

### "Unauthorized" errors
- Controleer of de RLS policies correct zijn geïnstalleerd
- Ga naar Supabase → Authentication → Policies

### TypeScript errors in Supabase client
- Dit is normaal - Supabase client genereert types dynamisch
- De app werkt ondanks deze warnings

## Volgende Stappen

Nu de backend is opgezet, kun je:
1. Lessen aanmaken en beheren
2. Studenten toevoegen aan instructeurs
3. De agenda functionaliteit gebruiken
4. De app verder uitbreiden met extra features

## Support

Voor vragen of problemen met de Supabase setup:
1. Check de Supabase documentatie: https://supabase.com/docs
2. Check de Row Level Security policies in je dashboard
3. Check de browser console voor specifieke error messages
