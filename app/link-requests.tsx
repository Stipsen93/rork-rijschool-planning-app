import React, { useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Link2, UserCheck, UserX, Loader2, Mail } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthStore";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

function formatRelativeTime(value?: string | null) {
  if (!value) {
    return "Zojuist";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Zojuist";
  }

  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) {
    return `${minutes} min geleden`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} u geleden`;
  }

  const days = Math.floor(hours / 24);
  return `${days} d geleden`;
}

type ProfileSummary = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type IncomingRequest = {
  id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message: string | null;
  created_at: string;
  responded_at: string | null;
  student?: ProfileSummary | null;
};

type OutgoingRequest = {
  id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message: string | null;
  created_at: string;
  responded_at: string | null;
  updated_at: string | null;
  instructor?: ProfileSummary | null;
};

export default function LinkRequestsScreen() {
  const router = useRouter();
  const { profile, isAuthenticated, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const isInstructor = profile?.role === "instructor";
  const isStudent = profile?.role === "student";

  const instructorRequestsQuery = useQuery({
    queryKey: ['instructor-link-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      console.log('[LinkRequests] Fetching instructor requests');
      const { data, error } = await supabase
        .from('instructor_link_requests')
        .select(`
          id,
          status,
          message,
          created_at,
          responded_at,
          student:student_id (id, first_name, last_name, email)
        `)
        .eq('instructor_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[LinkRequests] Error fetching instructor requests:', error);
        throw error;
      }

      console.log('[LinkRequests] Instructor requests:', data);
      return data.map((req: any) => ({
        id: req.id,
        status: req.status,
        message: req.message,
        created_at: req.created_at,
        responded_at: req.responded_at,
        student: req.student ? {
          first_name: req.student.first_name,
          last_name: req.student.last_name,
          email: req.student.email,
        } : null,
      })) as IncomingRequest[];
    },
    enabled: Boolean(isAuthenticated && isInstructor && user?.id),
    staleTime: 1000 * 30,
  });

  const studentRequestsQuery = useQuery({
    queryKey: ['student-link-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      console.log('[LinkRequests] Fetching student requests');
      const { data, error } = await supabase
        .from('instructor_link_requests')
        .select(`
          id,
          status,
          message,
          created_at,
          responded_at,
          updated_at,
          instructor:instructor_id (id, first_name, last_name, email)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[LinkRequests] Error fetching student requests:', error);
        throw error;
      }

      console.log('[LinkRequests] Student requests:', data);
      return data.map((req: any) => ({
        id: req.id,
        status: req.status,
        message: req.message,
        created_at: req.created_at,
        responded_at: req.responded_at,
        updated_at: req.updated_at,
        instructor: req.instructor ? {
          first_name: req.instructor.first_name,
          last_name: req.instructor.last_name,
          email: req.instructor.email,
        } : null,
      })) as OutgoingRequest[];
    },
    enabled: Boolean(isAuthenticated && isStudent && user?.id),
    staleTime: 1000 * 30,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      console.log('[LinkRequests] Responding to request:', requestId, accept);
      
      const statusValue = accept ? 'accepted' : 'rejected';
      const now = new Date().toISOString();
      
      if (accept) {
        const { data: requestData, error: fetchError } = await (supabase
          .from('instructor_link_requests') as any)
          .select('student_id, instructor_id')
          .eq('id', requestId)
          .single();
        
        if (fetchError || !requestData) {
          console.error('[LinkRequests] Error fetching request data:', fetchError);
          throw fetchError || new Error('Request data not found');
        }
        
        const studentId = requestData.student_id as string;
        const instructorId = requestData.instructor_id as string;
        
        console.log('[LinkRequests] Updating existing student profile with instructor_id');

        const { error: updateError } = await (supabase
          .from('student_profiles') as any)
          .update({ instructor_id: instructorId })
          .eq('user_id', studentId);

        if (updateError) {
          const updateMessage =
            typeof (updateError as any)?.message === 'string'
              ? String((updateError as any).message)
              : (() => {
                  try {
                    return JSON.stringify(updateError);
                  } catch {
                    return 'Kon studentprofiel niet updaten';
                  }
                })();

          console.error('[LinkRequests] Error updating student profile:', updateError);
          throw new Error(updateMessage);
        }

        console.log('[LinkRequests] Student profile updated with instructor_id:', instructorId);
      }
      
      const { error } = await (supabase
        .from('instructor_link_requests') as any)
        .update({
          status: statusValue,
          responded_at: now,
          updated_at: now,
        })
        .eq('id', requestId);

      if (error) {
        console.error('[LinkRequests] Error responding:', error);
        throw new Error(error.message ?? 'Kon niet reageren');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-link-requests'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) => {
      console.log('[LinkRequests] Cancelling request:', requestId);
      
      const now = new Date().toISOString();
      
      const { error } = await (supabase
        .from('instructor_link_requests') as any)
        .update({
          status: 'cancelled',
          updated_at: now,
        })
        .eq('id', requestId);

      if (error) {
        console.error('[LinkRequests] Error cancelling:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-link-requests'] });
    },
  });

  const instructorRequests = useMemo<IncomingRequest[]>(
    () => instructorRequestsQuery.data ?? [],
    [instructorRequestsQuery.data],
  );
  const studentRequests = useMemo<OutgoingRequest[]>(
    () => studentRequestsQuery.data ?? [],
    [studentRequestsQuery.data],
  );

  const { mutateAsync: respondAsync } = respondMutation;

  const handleRespond = useCallback(async (requestId: string, accept: boolean) => {
    try {
      console.log("[LinkRequests] Responding to request", requestId, accept ? "accept" : "reject");
      await respondAsync({ requestId, accept });
      Alert.alert("Succes", accept ? "Verzoek geaccepteerd" : "Verzoek afgewezen");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : typeof (error as any)?.message === 'string'
              ? String((error as any).message)
              : typeof (error as any)?.error_description === 'string'
                ? String((error as any).error_description)
                : (() => {
                    try {
                      return JSON.stringify(error);
                    } catch {
                      return 'Kon niet reageren';
                    }
                  })();

      console.error("[LinkRequests] respond error", error);
      Alert.alert("Fout", message);
    }
  }, [respondAsync]);

  const { mutateAsync: cancelAsync } = cancelMutation;

  const handleCancel = useCallback(async (requestId: string) => {
    try {
      console.log("[LinkRequests] Cancelling request", requestId);
      await cancelAsync(requestId);
      Alert.alert("Succes", "Verzoek geannuleerd");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kon niet annuleren";
      console.error("[LinkRequests] cancel error", message);
      Alert.alert("Fout", message);
    }
  }, [cancelAsync]);

  const { refetch: refetchInstructor } = instructorRequestsQuery;
  const { refetch: refetchStudent } = studentRequestsQuery;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isInstructor) {
        await refetchInstructor();
      }
      if (isStudent) {
        await refetchStudent();
      }
    } finally {
      setRefreshing(false);
    }
  }, [refetchInstructor, refetchStudent, isInstructor, isStudent]);

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerTitle}>Log in om koppelverzoeken te bekijken</Text>
        <Pressable onPress={() => router.replace("/login")} style={styles.primaryBtn} testID="link-requests-login">
          <Text style={styles.primaryBtnText}>Inloggen</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.root}>
        <Stack.Screen options={{ title: "Koppelverzoeken" }} />
        <ScrollView
          testID="link-requests-screen"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.scrollContent}
        >
          <LinearGradient colors={["#0f172a", "#1d4ed8"]} style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <Link2 color="#fff" size={28} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Verbind met instructeurs en leerlingen</Text>
              <Text style={styles.heroSubtitle}>
                Beheer openstaande verzoeken en houd iedereen gesynchroniseerd
              </Text>
            </View>
          </LinearGradient>

          {isInstructor && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <UserCheck color="#0f172a" size={18} />
                <Text style={styles.sectionTitle}>Binnengekomen verzoeken</Text>
              </View>

              {instructorRequestsQuery.isLoading && (
                <View style={styles.loadingRow}>
                  <Loader2 color="#1d4ed8" size={18} />
                  <Text style={styles.loadingText}>Laden...</Text>
                </View>
              )}

              {instructorRequests.length === 0 && !instructorRequestsQuery.isLoading && (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Geen openstaande verzoeken</Text>
                  <Text style={styles.emptySubtitle}>Nieuwe aanvragen verschijnen hier automatisch</Text>
                </View>
              )}

              {instructorRequests.map((request) => (
                <View key={request.id} style={styles.card} testID={`incoming-request-${request.id}`}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {request.student?.first_name} {request.student?.last_name}
                    </Text>
                    <Text style={styles.cardSubtitle}>{request.student?.email}</Text>
                    <Text style={styles.cardMeta}>Verstuurd {formatRelativeTime(request.created_at)}</Text>
                    {request.message && <Text style={styles.cardMessage}>{request.message}</Text>}
                  </View>
                  <View style={styles.cardActions}>
                    <Pressable
                      testID={`reject-request-${request.id}`}
                      onPress={() => handleRespond(request.id, false)}
                      disabled={respondMutation.isPending}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.rejectBtn,
                        { opacity: pressed || respondMutation.isPending ? 0.6 : 1 },
                      ]}
                    >
                      <UserX color="#b91c1c" size={18} />
                      <Text style={styles.actionText}>Weiger</Text>
                    </Pressable>
                    <Pressable
                      testID={`accept-request-${request.id}`}
                      onPress={() => handleRespond(request.id, true)}
                      disabled={respondMutation.isPending}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.acceptBtn,
                        { opacity: pressed || respondMutation.isPending ? 0.6 : 1 },
                      ]}
                    >
                      <UserCheck color="#166534" size={18} />
                      <Text style={[styles.actionText, { color: "#166534" }]}>Accepteer</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {isStudent && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Mail color="#0f172a" size={18} />
                <Text style={styles.sectionTitle}>Mijn aanvragen</Text>
              </View>

              {studentRequestsQuery.isLoading && (
                <View style={styles.loadingRow}>
                  <Loader2 color="#1d4ed8" size={18} />
                  <Text style={styles.loadingText}>Laden...</Text>
                </View>
              )}

              {studentRequests.length === 0 && !studentRequestsQuery.isLoading && (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Je hebt nog niets verzonden</Text>
                  <Text style={styles.emptySubtitle}>Zoek een instructeur en stuur een verzoek vanuit leerlingenlijst</Text>
                </View>
              )}

              {studentRequests.map((request) => (
                <View key={request.id} style={styles.card} testID={`outgoing-request-${request.id}`}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {request.instructor?.first_name} {request.instructor?.last_name}
                    </Text>
                    <Text style={styles.cardSubtitle}>{request.instructor?.email}</Text>
                    <Text style={styles.cardMeta}>Status: {request.status}</Text>
                    <Text style={styles.cardMeta}>Laatste update {formatRelativeTime(request.responded_at ?? request.updated_at ?? request.created_at)}</Text>
                    {request.message && <Text style={styles.cardMessage}>{request.message}</Text>}
                  </View>
                  {request.status === "pending" && (
                    <View style={styles.cardActions}>
                      <Pressable
                        testID={`cancel-request-${request.id}`}
                        onPress={() => handleCancel(request.id)}
                        disabled={cancelMutation.isPending}
                        style={({ pressed }) => [
                          styles.actionBtn,
                          styles.rejectBtn,
                          { opacity: pressed || cancelMutation.isPending ? 0.6 : 1 },
                        ]}
                      >
                        <UserX color="#b91c1c" size={18} />
                        <Text style={styles.actionText}>Annuleer</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {!isInstructor && !isStudent && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Geen rol gevonden</Text>
              <Text style={styles.emptySubtitle}>Werk je profiel bij om koppelverzoeken te gebruiken</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  scrollContent: {
    paddingBottom: 32,
    gap: 24,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
  },
  heroIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginHorizontal: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#475569",
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#475569",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    gap: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#475569",
  },
  cardMeta: {
    fontSize: 12,
    color: "#64748b",
  },
  cardMessage: {
    marginTop: 8,
    fontSize: 13,
    color: "#0f172a",
    lineHeight: 18,
  },
  cardActions: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#991b1b",
  },
  rejectBtn: {
    borderColor: "#fee2e2",
    backgroundColor: "#fff1f2",
  },
  acceptBtn: {
    borderColor: "#bbf7d0",
    backgroundColor: "#dcfce7",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f5f7fb",
    gap: 16,
  },
  centerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
