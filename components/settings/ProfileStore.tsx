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

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<InstructorProfile>(defaultProfile);
  const [loading, setLoading] = useState<boolean>(true);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    (async () => {
      console.log("[ProfileStore] Loading instructor profile...");
      try {
        const stored = await AsyncStorage.getItem(PROFILE_KEY);
        let parsedProfile = stored ? JSON.parse(stored) as InstructorProfile : defaultProfile;

        if (meQuery.data?.extendedProfile) {
          const instructorNumber = meQuery.data.extendedProfile.instructor_number || "";
          console.log("[ProfileStore] Syncing instructor number from backend:", instructorNumber);
          parsedProfile = {
            ...parsedProfile,
            instructorNumber,
          };
          await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(parsedProfile));
        }

        setProfile(parsedProfile);
        console.log("[ProfileStore] Loaded profile", parsedProfile);
      } catch (e) {
        console.error("[ProfileStore] Failed to load profile", e);
      } finally {
        setLoading(false);
      }
    })();
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
