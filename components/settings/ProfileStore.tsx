import { useEffect, useState, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

function generateInstructorNumber(): string {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
}

const defaultProfile: InstructorProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  certificationNumber: "",
  drivingSchoolName: "",
  drivingSchools: [],
  birthDate: null,
  instructorNumber: generateInstructorNumber(),
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

  useEffect(() => {
    (async () => {
      console.log("[ProfileStore] Loading instructor profile...");
      try {
        const stored = await AsyncStorage.getItem(PROFILE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as InstructorProfile;
          if (!parsed.instructorNumber) {
            parsed.instructorNumber = generateInstructorNumber();
          }
          setProfile(parsed);
          console.log("[ProfileStore] Loaded profile", parsed);
        } else {
          setProfile(defaultProfile);
        }
      } catch (e) {
        console.error("[ProfileStore] Failed to load profile", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      loading,
      fullName,
      updateProfile,
    }),
    [profile, loading, fullName, updateProfile]
  );

  return value;
});
