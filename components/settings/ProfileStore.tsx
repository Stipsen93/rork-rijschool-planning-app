import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../auth/AuthStore";
import type { Database } from "@/types/supabase";

export type InstructorProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  certificationNumber: string;
  drivingSchoolName: string;
  drivingSchools: string[];
  birthDate: string | null;
  instructorNumber: string;
  experienceYears: string;
  taxId: string;
  address: string;
  iban: string;
  specializations: string[];
  profileImageUrl: string | null;
};

type InstructorProfileRow = Database["public"]["Tables"]["instructor_profiles"]["Row"];

const defaultProfile: InstructorProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  certificationNumber: "",
  drivingSchoolName: "",
  drivingSchools: [],
  birthDate: null,
  instructorNumber: "",
  experienceYears: "",
  taxId: "",
  address: "",
  iban: "",
  specializations: [],
  profileImageUrl: null,
};

function rowToProfile(row: InstructorProfileRow | null, fallbackEmail: string): InstructorProfile {
  return {
    firstName: row?.first_name ?? "",
    lastName: row?.last_name ?? "",
    email: fallbackEmail,
    phoneNumber: row?.phone ?? "",
    certificationNumber: row?.wrm_pass_number ?? "",
    drivingSchoolName: row?.driving_school_name ?? "",
    drivingSchools: Array.isArray(row?.driving_school_affiliation)
      ? (row?.driving_school_affiliation ?? []).filter(Boolean)
      : [],
    birthDate: row?.birth_date ?? null,
    instructorNumber: row?.instructor_number ?? "",
    experienceYears: row?.years_experience != null ? String(row.years_experience) : "",
    taxId: row?.tax_id ?? "",
    address: row?.business_address ?? "",
    iban: row?.iban ?? "",
    specializations: Array.isArray(row?.specializations) ? (row?.specializations ?? []).filter(Boolean) : [],
    profileImageUrl: null,
  };
}

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const { isAuthenticated, user, profile: authProfile } = useAuth();
  const isInstructor = authProfile?.role === "instructor";
  const userId = user?.id ?? null;
  const fallbackEmail = authProfile?.email ?? "";

  const [profile, setProfile] = useState<InstructorProfile>(defaultProfile);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated || !isInstructor || !userId) {
      setProfile({ ...defaultProfile, email: fallbackEmail });
      setLoading(false);
      return;
    }

    console.log("[ProfileStore] Loading instructor profile from Supabase (instructor_profiles)", { userId });
    setLoading(true);

    const { data, error } = await supabase
      .from("instructor_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[ProfileStore] Failed to load instructor_profiles", error.message);
      setProfile({ ...defaultProfile, email: fallbackEmail });
      setLoading(false);
      return;
    }

    if (!data) {
      console.log("[ProfileStore] No instructor_profiles row yet; using defaults", { userId });
      setProfile({ ...defaultProfile, email: fallbackEmail });
      setLoading(false);
      return;
    }

    console.log("[ProfileStore] Loaded instructor_profiles data:", data);
    const mappedProfile = rowToProfile(data as InstructorProfileRow, fallbackEmail);
    console.log("[ProfileStore] Mapped profile:", mappedProfile);
    setProfile(mappedProfile);
    setLoading(false);
  }, [fallbackEmail, isAuthenticated, isInstructor, userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(
    async (newProfile: InstructorProfile) => {
      if (!isAuthenticated || !isInstructor || !userId) {
        throw new Error("Niet ingelogd");
      }

      console.log("[ProfileStore] Saving instructor profile to Supabase (instructor_profiles)", { userId });
      setSyncing(true);

      const yearsExperience = newProfile.experienceYears.trim();
      const yearsValue = yearsExperience.length ? Number(yearsExperience) : null;

      const payload: Database["public"]["Tables"]["instructor_profiles"]["Insert"] = {
        user_id: userId,
        first_name: newProfile.firstName.trim() || null,
        last_name: newProfile.lastName.trim() || null,
        phone: newProfile.phoneNumber.trim() || null,
        birth_date: newProfile.birthDate,
        instructor_number: newProfile.instructorNumber.trim() || null,
        wrm_pass_number: newProfile.certificationNumber.trim() || null,
        driving_school_name: newProfile.drivingSchoolName.trim() || null,
        driving_school_affiliation: newProfile.drivingSchools,
        years_experience: Number.isFinite(yearsValue) ? yearsValue : null,
        tax_id: newProfile.taxId.trim() || null,
        business_address: newProfile.address.trim() || null,
        iban: newProfile.iban.trim() || null,
        specializations: newProfile.specializations,
      };

      const { error } = await (supabase
        .from("instructor_profiles") as any)
        .upsert([payload], { onConflict: "user_id" });

      if (error) {
        console.error("[ProfileStore] Failed to save instructor_profiles", error.message);
        setSyncing(false);
        throw new Error(error.message || "Opslaan mislukt");
      }

      setProfile({ ...newProfile, email: fallbackEmail });
      setSyncing(false);

      await loadProfile();
    },
    [fallbackEmail, isAuthenticated, isInstructor, loadProfile, userId],
  );

  const fullName = useMemo(() => {
    return `${profile.firstName} ${profile.lastName}`.trim() || "Instructeur";
  }, [profile.firstName, profile.lastName]);

  return useMemo(
    () => ({
      profile,
      loading,
      fullName,
      updateProfile,
      syncing,
    }),
    [profile, loading, fullName, updateProfile, syncing],
  );
});
