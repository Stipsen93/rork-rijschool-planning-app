import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Check, X, UserPlus } from "lucide-react-native";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

interface LinkRequest {
  id: string;
  student: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    phone: string | null;
  };
  message: string | null;
  created_at: string;
  status: string;
}

const MOCK_REQUESTS: LinkRequest[] = [
  {
    id: "1",
    student: {
      id: "s1",
      full_name: "Emma Jansen",
      email: "emma.jansen@example.com",
      avatar_url: "https://i.pravatar.cc/150?img=44",
      phone: "+31612345678",
    },
    message: "Hallo, ik zou graag rijlessen bij u willen volgen!",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
  {
    id: "2",
    student: {
      id: "s2",
      full_name: "Lars Bakker",
      email: "lars.bakker@example.com",
      avatar_url: "https://i.pravatar.cc/150?img=14",
      phone: "+31687654321",
    },
    message: null,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
  {
    id: "3",
    student: {
      id: "s3",
      full_name: "Sophie de Vries",
      email: "sophie.devries@example.com",
      avatar_url: "https://i.pravatar.cc/150?img=48",
      phone: "+31698765432",
    },
    message: "Ik ben aangeraden door een vriend. Graag les bij u!",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
];

export default function LinkRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<LinkRequest[]>(MOCK_REQUESTS);
  const [loading, setLoading] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} minuten geleden`;
    } else if (diffHours < 24) {
      return `${diffHours} uur geleden`;
    } else if (diffDays === 1) {
      return "1 dag geleden";
    } else {
      return `${diffDays} dagen geleden`;
    }
  };

  const handleAccept = (request: LinkRequest) => {
    Alert.alert(
      "Koppelverzoek accepteren",
      `Wil je ${request.student.full_name || request.student.email} accepteren als leerling?`,
      [
        {
          text: "Annuleren",
          style: "cancel",
        },
        {
          text: "Accepteren",
          onPress: async () => {
            setProcessingId(request.id);
            setTimeout(() => {
              setRequests((prev) =>
                prev.filter((r) => r.id !== request.id)
              );
              setProcessingId(null);
              Alert.alert(
                "Geaccepteerd",
                `${request.student.full_name || request.student.email} is nu je leerling!`
              );
            }, 800);
          },
        },
      ]
    );
  };

  const handleReject = (request: LinkRequest) => {
    Alert.alert(
      "Koppelverzoek weigeren",
      `Wil je het verzoek van ${request.student.full_name || request.student.email} weigeren?`,
      [
        {
          text: "Annuleren",
          style: "cancel",
        },
        {
          text: "Weigeren",
          style: "destructive",
          onPress: async () => {
            setProcessingId(request.id);
            setTimeout(() => {
              setRequests((prev) =>
                prev.filter((r) => r.id !== request.id)
              );
              setProcessingId(null);
              Alert.alert("Geweigerd", "Het koppelverzoek is geweigerd.");
            }, 800);
          },
        },
      ]
    );
  };

  const renderRequest = ({ item }: { item: LinkRequest }) => {
    const isProcessing = processingId === item.id;

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          {item.student.avatar_url ? (
            <Image
              source={{ uri: item.student.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {(item.student.full_name || item.student.email)
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>
              {item.student.full_name || item.student.email}
            </Text>
            <Text style={styles.studentEmail}>{item.student.email}</Text>
            {item.student.phone && (
              <Text style={styles.studentPhone}>{item.student.phone}</Text>
            )}
            <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
          </View>
        </View>

        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Bericht:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleReject(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <>
                <X color="#ef4444" size={18} />
                <Text style={styles.rejectButtonText}>Weigeren</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleAccept(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check color="#fff" size={18} />
                <Text style={styles.acceptButtonText}>Accepteren</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Koppelverzoeken",
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: "600",
            },
            headerBackVisible: true,
          }}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Koppelverzoeken laden...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <UserPlus color="#9ca3af" size={64} />
            <Text style={styles.emptyText}>Geen openstaande verzoeken</Text>
            <Text style={styles.emptySubtext}>
              Wanneer leerlingen een koppelverzoek versturen, verschijnen ze
              hier
            </Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2563EB",
  },
  studentInfo: {
    flex: 1,
    justifyContent: "center",
  },
  studentName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  studentPhone: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  messageContainer: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#6b7280",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#ef4444",
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
