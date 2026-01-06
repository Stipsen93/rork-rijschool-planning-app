import { useEffect, useState, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpc";
import { useAuth } from "../auth/AuthStore";

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
  const { isAuthenticated, profile: authProfile } = useAuth();
  const isInstructor = authProfile?.role === "instructor";

  const remoteQuery = trpc.instructor.getProfile.useQuery(undefined, {
    enabled: isAuthenticated && isInstructor,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const updateMutation = trpc.instructor.updateProfile.useMutation();

  useEffect(() => {
    if (!isAuthenticated || !isInstructor) {
      setProfile(defaultProfile);
      setLoading(false);
      return;
    }

    if (remoteQuery.data?.profile) {
      console.log("[ProfileStore] Loaded profile from Supabase via tRPC");
      setProfile(remoteQuery.data.profile as InstructorProfile);
      setLoading(false);
      return;
    }

    setLoading(remoteQuery.isLoading);
  }, [isAuthenticated, isInstructor, remoteQuery.data, remoteQuery.isLoading]);

  const updateProfile = useCallback(
    async (newProfile: InstructorProfile) => {
      console.log("[ProfileStore] Updating profile", newProfile);

      await updateMutation.mutateAsync({
        profile: {
          firstName: newProfile.firstName,
          lastName: newProfile.lastName,
          phoneNumber: newProfile.phoneNumber,
          birthDate: newProfile.birthDate,
          instructorNumber: newProfile.instructorNumber,
          certificationNumber: newProfile.certificationNumber,
          drivingSchoolName: newProfile.drivingSchoolName,
          drivingSchools: newProfile.drivingSchools,
          experienceYears: newProfile.experienceYears,
          taxId: newProfile.taxId,
          address: newProfile.address,
          iban: newProfile.iban,
          specializations: newProfile.specializations,
          profileImageUrl: newProfile.profileImageUrl,
        },
      });

      setProfile(newProfile);
      try {
        await remoteQuery.refetch();
      } catch (e) {
        console.log("[ProfileStore] Refetch after update failed", e);
      }
    },
    [updateMutation, remoteQuery],
  );

  const fullName = useMemo(() => {
    return `${profile.firstName} ${profile.lastName}`.trim() || "Instructeur";
  }, [profile.firstName, profile.lastName]);

  const value = useMemo(
    () => ({
      profile,
      loading: loading || remoteQuery.isLoading,
      fullName,
      updateProfile,
      syncing: updateMutation.isPending,
    }),
    [profile, loading, remoteQuery.isLoading, fullName, updateProfile, updateMutation.isPending]
  );

  return value;
});
