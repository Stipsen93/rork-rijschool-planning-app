import { useEffect, useState, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

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

const PROFILE_KEY = "instructor_profile" as const;

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

type RemoteExtendedInstructorProfile = Partial<{
  instructor_number: string | null;
  wrm_pass_number: string | null;
  driving_school_name: string | null;
  driving_school_affiliation: string[] | null;
  years_experience: number | null;
  tax_id: string | null;
  business_address: string | null;
  iban: string | null;
  specializations: string[] | null;
}>;

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<InstructorProfile>(defaultProfile);
  const [loading, setLoading] = useState<boolean>(true);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      console.log("[ProfileStore] Loading instructor profile...");
      try {
        const stored = await AsyncStorage.getItem(PROFILE_KEY);
        let mergedProfile = stored ? (JSON.parse(stored) as InstructorProfile) : defaultProfile;

        if (meQuery.data) {
          const remoteProfile = meQuery.data.profile;
          const extended = (meQuery.data.extendedProfile ?? null) as RemoteExtendedInstructorProfile | null;

          const updatedProfile: InstructorProfile = {
            ...mergedProfile,
            firstName: remoteProfile?.first_name ?? mergedProfile.firstName,
            lastName: remoteProfile?.last_name ?? mergedProfile.lastName,
            email: remoteProfile?.email ?? mergedProfile.email,
            phoneNumber: remoteProfile?.phone ?? mergedProfile.phoneNumber,
            birthDate: remoteProfile?.birth_date ?? mergedProfile.birthDate,
            certificationNumber: extended?.wrm_pass_number ?? mergedProfile.certificationNumber,
            drivingSchoolName: extended?.driving_school_name ?? mergedProfile.drivingSchoolName,
            instructorNumber: extended?.instructor_number ?? mergedProfile.instructorNumber,
            experienceYears:
              extended?.years_experience !== undefined && extended?.years_experience !== null
                ? extended.years_experience.toString()
                : mergedProfile.experienceYears,
            taxId: extended?.tax_id ?? mergedProfile.taxId,
            address: extended?.business_address ?? mergedProfile.address,
            iban: extended?.iban ?? mergedProfile.iban,
            drivingSchools:
              Array.isArray(extended?.driving_school_affiliation) && extended.driving_school_affiliation.length > 0
                ? extended.driving_school_affiliation
                : mergedProfile.drivingSchools,
            specializations: Array.isArray(extended?.specializations)
              ? extended.specializations
              : mergedProfile.specializations,
          };

          mergedProfile = updatedProfile;
        }

        if (!cancelled) {
          setProfile(mergedProfile);
          await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(mergedProfile));
          console.log("[ProfileStore] Loaded profile", mergedProfile);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[ProfileStore] Failed to load profile", e);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [meQuery.data]);

  const updateProfile = useCallback(async (newProfile: InstructorProfile) => {
    console.log("[ProfileStore] Updating profile", newProfile);
    console.log("[ProfileStore] Saving to AsyncStorage...", newProfile);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    console.log("[ProfileStore] Successfully saved to AsyncStorage");
    setProfile(newProfile);
  }, []);

  const fullName = useMemo(() => {
    return `${profile.firstName} ${profile.lastName}`.trim() || "Instructeur";
  }, [profile.firstName, profile.lastName]);

  const value = useMemo(
    () => ({
      profile,
      loading: loading || meQuery.isLoading,
      fullName,
      updateProfile,
    }),
    [profile, loading, meQuery.isLoading, fullName, updateProfile]
  );

  return value;
});
