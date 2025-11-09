import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Search, Star, MapPin, X, Check } from "lucide-react-native";

interface Instructor {
  id: string;
  name: string;
  photo: string;
  rating: number;
  reviewCount: number;
  location: string;
  school: string;
  specializations: string[];
  isRequested?: boolean;
}

const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: "1",
    name: "Jan de Vries",
    photo: "https://i.pravatar.cc/150?img=12",
    rating: 4.8,
    reviewCount: 124,
    location: "Amsterdam",
    school: "Rijschool Amsterdam",
    specializations: ["Autorijles", "Examentraining"],
  },
  {
    id: "2",
    name: "Maria van Dijk",
    photo: "https://i.pravatar.cc/150?img=47",
    rating: 4.9,
    reviewCount: 98,
    location: "Utrecht",
    school: "VerkeersSmart",
    specializations: ["Autorijles", "Faalangst coaching"],
  },
  {
    id: "3",
    name: "Pieter Bakker",
    photo: "https://i.pravatar.cc/150?img=33",
    rating: 4.7,
    reviewCount: 156,
    location: "Rotterdam",
    school: "De Rijschool Rotterdam",
    specializations: ["Autorijles", "Snelweg training"],
  },
  {
    id: "4",
    name: "Sophie Jansen",
    photo: "https://i.pravatar.cc/150?img=45",
    rating: 5.0,
    reviewCount: 78,
    location: "Den Haag",
    school: "DriveAcademy",
    specializations: ["Autorijles", "Defensief rijden"],
  },
  {
    id: "5",
    name: "Luuk Vermeer",
    photo: "https://i.pravatar.cc/150?img=52",
    rating: 4.6,
    reviewCount: 142,
    location: "Eindhoven",
    school: "Rijschool Zuid",
    specializations: ["Autorijles", "Spits training"],
  },
];

export default function FindInstructorScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [instructors, setInstructors] = useState<Instructor[]>(MOCK_INSTRUCTORS);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setInstructors(MOCK_INSTRUCTORS);
    } else {
      const filtered = MOCK_INSTRUCTORS.filter(
        (instructor) =>
          instructor.name.toLowerCase().includes(query.toLowerCase()) ||
          instructor.location.toLowerCase().includes(query.toLowerCase()) ||
          instructor.school.toLowerCase().includes(query.toLowerCase())
      );
      setInstructors(filtered);
    }
  };

  const handleSendRequest = (instructor: Instructor) => {
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
            const updatedInstructors = instructors.map((item) =>
              item.id === instructor.id ? { ...item, isRequested: true } : item
            );
            setInstructors(updatedInstructors);
            Alert.alert(
              "Verzoek verstuurd",
              `Je koppelverzoek is verstuurd naar ${instructor.name}. Je ontvangt een melding wanneer de instructeur reageert.`
            );
          },
        },
      ]
    );
  };

  const handleCancelRequest = (instructor: Instructor) => {
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
            const updatedInstructors = instructors.map((item) =>
              item.id === instructor.id ? { ...item, isRequested: false } : item
            );
            setInstructors(updatedInstructors);
            Alert.alert("Verzoek ingetrokken", "Je koppelverzoek is ingetrokken.");
          },
        },
      ]
    );
  };

  const renderInstructor = ({ item }: { item: Instructor }) => (
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
        </View>
      </View>

      <View style={styles.locationRow}>
        <MapPin color="#6b7280" size={16} />
        <Text style={styles.location}>{item.location}</Text>
      </View>

      <View style={styles.specializationsRow}>
        {item.specializations.map((spec, index) => (
          <View key={index} style={styles.specializationBadge}>
            <Text style={styles.specializationText}>{spec}</Text>
          </View>
        ))}
      </View>

      {item.isRequested ? (
        <TouchableOpacity
          style={styles.requestedButton}
          onPress={() => handleCancelRequest(item)}
        >
          <Check color="#10b981" size={18} />
          <Text style={styles.requestedButtonText}>Verzoek verstuurd</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => handleSendRequest(item)}
        >
          <Text style={styles.requestButtonText}>Koppelverzoek versturen</Text>
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
            placeholder="Zoek op naam, locatie of rijschool..."
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

      <FlatList
        data={instructors}
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: "#6b7280",
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
});
