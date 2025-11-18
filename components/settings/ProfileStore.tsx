import { useEffect, useState, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
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
  driving_school_id: string | null;
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

  const syncProfileMutation = trpc.instructor.syncSettings.useMutation();

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
          const userMetadata = (meQuery.data.user?.user_metadata ?? null) as Record<string, unknown> | null;

          let metadataWrm: string | undefined;
          if (userMetadata && typeof userMetadata["wrm_pass_number"] === "string") {
            metadataWrm = userMetadata["wrm_pass_number"] as string;
          }

          let metadataDrivingSchoolName: string | undefined;
          if (userMetadata && typeof userMetadata["driving_school_name"] === "string") {
            metadataDrivingSchoolName = userMetadata["driving_school_name"] as string;
          }

          let resolvedDrivingSchoolName = extended?.driving_school_name ?? metadataDrivingSchoolName ?? mergedProfile.drivingSchoolName;
          const drivingSchoolId = extended?.driving_school_id && typeof extended.driving_school_id === "string" ? extended.driving_school_id : null;
          const rawAffiliations = Array.isArray(extended?.driving_school_affiliation)
            ? (extended?.driving_school_affiliation.filter((item) => typeof item === "string") as string[])
            : [];
          let resolvedAffiliations = rawAffiliations;

          if (
            (!resolvedDrivingSchoolName || resolvedDrivingSchoolName.length === 0 || (resolvedDrivingSchoolName === mergedProfile.drivingSchoolName && rawAffiliations.length > 0)) ||
            rawAffiliations.some((value) => /^[0-9a-fA-F-]{32,36}$/.test(value)) ||
            Boolean(drivingSchoolId)
          ) {
            const identifiersToLookup = [
              ...rawAffiliations.filter((value) => /^[0-9a-fA-F-]{32,36}$/.test(value)),
              ...(drivingSchoolId ? [drivingSchoolId] : []),
            ];
            if (identifiersToLookup.length > 0) {
              try {
                console.log("[ProfileStore] Resolving driving school names from Supabase", identifiersToLookup);
                const { data: schoolRows, error: schoolError } = await (supabase.from("driving_schools") as any)
                  .select("id,name")
                  .in("id", identifiersToLookup);
                if (!schoolError && Array.isArray(schoolRows)) {
                  const map = new Map<string, string>();
                  schoolRows.forEach((row: { id?: string; name?: string }) => {
                    if (row && typeof row.id === "string" && typeof row.name === "string") {
                      map.set(row.id, row.name);
                    }
                  });
                  resolvedAffiliations = rawAffiliations.map((value) => map.get(value) ?? value);
                  if (drivingSchoolId && map.has(drivingSchoolId)) {
                    resolvedDrivingSchoolName = map.get(drivingSchoolId) ?? resolvedDrivingSchoolName;
                  }
                  if (!resolvedDrivingSchoolName && resolvedAffiliations.length > 0) {
                    resolvedDrivingSchoolName = resolvedAffiliations[0];
                  }
                } else if (schoolError) {
                  console.error("[ProfileStore] Failed to resolve driving school names", schoolError);
                }
              } catch (resolveError) {
                console.error("[ProfileStore] Error while resolving driving school names", resolveError);
              }
            }
          }

          if (!resolvedDrivingSchoolName && rawAffiliations.length > 0) {
            resolvedDrivingSchoolName = rawAffiliations[0];
          }

          const updatedProfile: InstructorProfile = {
            ...mergedProfile,
            firstName: remoteProfile?.first_name ?? mergedProfile.firstName,
            lastName: remoteProfile?.last_name ?? mergedProfile.lastName,
            email: remoteProfile?.email ?? mergedProfile.email,
            phoneNumber: remoteProfile?.phone ?? mergedProfile.phoneNumber,
            birthDate: remoteProfile?.birth_date ?? mergedProfile.birthDate,
            certificationNumber: extended?.wrm_pass_number ?? metadataWrm ?? mergedProfile.certificationNumber,
            drivingSchoolName: resolvedDrivingSchoolName ?? mergedProfile.drivingSchoolName,
            instructorNumber: extended?.instructor_number ?? mergedProfile.instructorNumber,
            experienceYears:
              extended?.years_experience !== undefined && extended?.years_experience !== null
                ? extended.years_experience.toString()
                : mergedProfile.experienceYears,
            taxId: extended?.tax_id ?? mergedProfile.taxId,
            address: extended?.business_address ?? mergedProfile.address,
            iban: extended?.iban ?? mergedProfile.iban,
            drivingSchools:
              resolvedAffiliations.length > 0
                ? resolvedAffiliations
                : metadataDrivingSchoolName
                ? [metadataDrivingSchoolName]
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

  const updateProfile = useCallback(
    async (newProfile: InstructorProfile) => {
      console.log("[ProfileStore] Updating profile", newProfile);
      try {
        await syncProfileMutation.mutateAsync({
          profile: {
            firstName: newProfile.firstName,
            lastName: newProfile.lastName,
            email: newProfile.email,
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
          },
        });

        setProfile(newProfile);
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
        console.log("[ProfileStore] Profile persisted locally and remotely");

        try {
          await meQuery.refetch();
        } catch (refetchError) {
          console.log("[ProfileStore] Refetch after sync failed", refetchError);
        }
      } catch (error) {
        console.error("[ProfileStore] Failed to sync profile", error);
        throw (error instanceof Error ? error : new Error("Failed to sync profile"));
      }
    },
    [syncProfileMutation, meQuery],
  );

  const fullName = useMemo(() => {
    return `${profile.firstName} ${profile.lastName}`.trim() || "Instructeur";
  }, [profile.firstName, profile.lastName]);

  const value = useMemo(
    () => ({
      profile,
      loading: loading || meQuery.isLoading,
      fullName,
      updateProfile,
      syncing: syncProfileMutation.isPending,
    }),
    [profile, loading, meQuery.isLoading, fullName, updateProfile, syncProfileMutation.isPending]
  );

  return value;
});
