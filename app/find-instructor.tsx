import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { Search, Star, X, Check } from "lucide-react-native";
import { trpc } from "@/lib/trpc";

interface Instructor {
  id: string;
  instructorProfileId: string;
  name: string;
  photo: string;
  rating: number;
  reviewCount: number;
  school: string;
  instructorNumber: string;
  specializations: string[];
  bio: string;
  isRequested?: boolean;
}



export default function FindInstructorScreen() {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const instructorsQuery = trpc.instructors.search.useQuery(
    { query: searchQuery },
    {
      refetchOnWindowFocus: false,
      staleTime: 30000,
    }
  );

  const myRequestsQuery = trpc.linkRequests.myRequests.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const sendRequestMutation = trpc.linkRequests.send.useMutation({
    onSuccess: () => {
      myRequestsQuery.refetch();
      Alert.alert(
        "Verzoek verstuurd",
        "Je koppelverzoek is verstuurd. Je ontvangt een melding wanneer de instructeur reageert."
      );
    },
    onError: (error) => {
      Alert.alert("Fout", error.message || "Kon verzoek niet versturen");
    },
  });

  const cancelRequestMutation = trpc.linkRequests.cancel.useMutation({
    onSuccess: () => {
      myRequestsQuery.refetch();
      Alert.alert("Verzoek ingetrokken", "Je koppelverzoek is ingetrokken.");
    },
    onError: (error) => {
      Alert.alert("Fout", error.message || "Kon verzoek niet intrekken");
    },
  });

  const instructorsWithRequestStatus = useMemo(() => {
    if (!instructorsQuery.data) return [];
    
    const pendingRequests = myRequestsQuery.data?.filter(
      (req) => req.status === "pending"
    ) || [];

    return instructorsQuery.data.map((instructor) => {
      const hasRequest = pendingRequests.some(
        (req) => req.instructor_id === instructor.id
      );
      return {
        ...instructor,
        isRequested: hasRequest,
        requestId: pendingRequests.find((req) => req.instructor_id === instructor.id)?.id,
      };
    });
  }, [instructorsQuery.data, myRequestsQuery.data]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSendRequest = (instructor: Instructor & { requestId?: string }) => {
    if (sendRequestMutation.isPending) return;

    Alert.alert(
      "Koppelverzoek versturen",
      `Wil je een koppelverzoek sturen naar ${instructor.name}?`,
      [
        {
          text: "Annuleren",
          style: "cancel",
        },
        {
          text: "Versturen",
          onPress: () => {
            sendRequestMutation.mutate({
              instructorId: instructor.id,
            });
          },
        },
      ]
    );
  };

  const handleCancelRequest = (instructor: Instructor & { requestId?: string }) => {
    if (cancelRequestMutation.isPending || !instructor.requestId) return;

    Alert.alert(
      "Verzoek intrekken",
      `Wil je je koppelverzoek naar ${instructor.name} intrekken?`,
      [
        {
          text: "Nee",
          style: "cancel",
        },
        {
          text: "Intrekken",
          style: "destructive",
          onPress: () => {
            cancelRequestMutation.mutate({ requestId: instructor.requestId! });
          },
        },
      ]
    );
  };

  const renderInstructor = ({ item }: { item: Instructor & { requestId?: string } }) => (
    <View style={styles.instructorCard}>
      <View style={styles.instructorHeader}>
        <Image source={{ uri: item.photo }} style={styles.instructorPhoto} />
        <View style={styles.instructorInfo}>
          <Text style={styles.instructorName}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Star color="#FFA500" size={14} fill="#FFA500" />
            <Text style={styles.rating}>
              {item.rating} ({item.reviewCount})
            </Text>
          </View>
          <Text style={styles.school}>{item.school}</Text>
          <Text style={styles.instructorNumber}>#{item.instructorNumber}</Text>
        </View>
      </View>



      {item.specializations && item.specializations.length > 0 && (
        <View style={styles.specializationsRow}>
          {item.specializations.map((spec, index) => (
            <View key={index} style={styles.specializationBadge}>
              <Text style={styles.specializationText}>{spec}</Text>
            </View>
          ))}
        </View>
      )}

      {item.isRequested ? (
        <TouchableOpacity
          style={styles.requestedButton}
          onPress={() => handleCancelRequest(item)}
          disabled={cancelRequestMutation.isPending}
        >
          {cancelRequestMutation.isPending ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : (
            <>
              <Check color="#10b981" size={18} />
              <Text style={styles.requestedButtonText}>Verzoek verstuurd</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => handleSendRequest(item)}
          disabled={sendRequestMutation.isPending}
        >
          {sendRequestMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.requestButtonText}>Koppelverzoek versturen</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Jouw instructeur",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
          },
          headerBackVisible: true,
        }}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search color="#6b7280" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Zoek op naam, locatie, rijschool of instructeur nummer..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <X color="#6b7280" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {instructorsQuery.isLoading || myRequestsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Instructeurs laden...</Text>
        </View>
      ) : instructorsQuery.isError ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Fout bij laden</Text>
          <Text style={styles.emptySubtext}>
            {instructorsQuery.error?.message || "Probeer het later opnieuw"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={instructorsWithRequestStatus}
          renderItem={renderInstructor}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Geen instructeurs gevonden</Text>
              <Text style={styles.emptySubtext}>
                Probeer een andere zoekterm
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  instructorCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  instructorHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  instructorPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  instructorInfo: {
    flex: 1,
    justifyContent: "center",
  },
  instructorName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  school: {
    fontSize: 14,
    color: "#6b7280",
  },
  instructorNumber: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600" as const,
    marginTop: 2,
  },

  specializationsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  specializationBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  specializationText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#2563EB",
  },
  requestButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  requestedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#d1fae5",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  requestedButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#10b981",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#6b7280",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
  },
});
