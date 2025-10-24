import React from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { User, ChevronRight, Clock, Boxes, Cog, CalendarRange, ArrowLeft } from "lucide-react-native";

export default function SettingsScreen() {
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                console.log("Navigating back to Overview");
                router.push("/(tabs)/");
              }}
              style={{ marginLeft: 8, padding: 8 }}
            >
              <ArrowLeft color="#2563EB" size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
      testID="settings-screen"
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            console.log("Refreshing settings...");
            setRefreshing(true);
            setTimeout(() => setRefreshing(false), 600);
          }}
        />
      }
    >
      <View style={styles.headerSpace}>
        <Text style={styles.title}>Instellingen</Text>
        <Text style={styles.text}>Beheer je app-instellingen.</Text>
      </View>

      <TouchableOpacity
        testID="settings-profile"
        style={styles.item}
        onPress={() => {
          console.log("Navigating to Profiel");
          router.push("/(tabs)/settings/profile");
        }}
        accessibilityRole="button"
      >
        <View style={styles.itemIconWrap}>
          <User color="#0ea5e9" size={22} />
        </View>
        <View style={styles.itemTextWrap}>
          <Text style={styles.itemTitle}>Profiel</Text>
          <Text style={styles.itemSubtitle}>Pas je persoonlijke gegevens aan</Text>
        </View>
        <ChevronRight color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity
        testID="settings-working-hours"
        style={styles.item}
        onPress={() => {
          console.log("Navigating to Werkuren");
          router.push("/(tabs)/settings/working-hours");
        }}
        accessibilityRole="button"
      >
        <View style={styles.itemIconWrap}>
          <Clock color="#0ea5e9" size={22} />
        </View>
        <View style={styles.itemTextWrap}>
          <Text style={styles.itemTitle}>Werkuren</Text>
          <Text style={styles.itemSubtitle}>Werkdagen, tijden en pauzes</Text>
        </View>
        <ChevronRight color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity
        testID="settings-lesson-configuration"
        style={styles.item}
        onPress={() => {
          console.log("Navigating to Les configuratie");
          router.push("/(tabs)/settings/lesson-configuration");
        }}
        accessibilityRole="button"
      >
        <View style={styles.itemIconWrap}>
          <Clock color="#0ea5e9" size={22} />
        </View>
        <View style={styles.itemTextWrap}>
          <Text style={styles.itemTitle}>Les configuratie</Text>
          <Text style={styles.itemSubtitle}>Duur, wachttijd en opties</Text>
        </View>
        <ChevronRight color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity
        testID="settings-packages-hours"
        style={styles.item}
        onPress={() => {
          console.log("Navigating to Pakketten/Uren");
          router.push("/(tabs)/settings/packages-hours");
        }}
        accessibilityRole="button"
      >
        <View style={styles.itemIconWrap}>
          <Boxes color="#0ea5e9" size={22} />
        </View>
        <View style={styles.itemTextWrap}>
          <Text style={styles.itemTitle}>Pakketten/Uren</Text>
          <Text style={styles.itemSubtitle}>Producten, pakketten en uurprijs</Text>
        </View>
        <ChevronRight color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity
        testID="settings-student-configuration"
        style={styles.item}
        onPress={() => {
          console.log("Navigating to Leerling Configuratie");
          router.push("/(tabs)/settings/student-configuration");
        }}
        accessibilityRole="button"
      >
        <View style={styles.itemIconWrap}>
          <Cog color="#0ea5e9" size={22} />
        </View>
        <View style={styles.itemTextWrap}>
          <Text style={styles.itemTitle}>Leerling Configuratie</Text>
          <Text style={styles.itemSubtitle}>Limieten en regels</Text>
        </View>
        <ChevronRight color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity
        testID="settings-availability-rules"
        style={styles.item}
        onPress={() => {
          console.log("Navigating to Beschikbaarheid regels");
          router.push("/(tabs)/settings/availability-rules");
        }}
        accessibilityRole="button"
      >
        <View style={styles.itemIconWrap}>
          <CalendarRange color="#0ea5e9" size={22} />
        </View>
        <View style={styles.itemTextWrap}>
          <Text style={styles.itemTitle}>Beschikbaarheid regels</Text>
          <Text style={styles.itemSubtitle}>Automatisering en buffers</Text>
        </View>
        <ChevronRight color="#9ca3af" />
      </TouchableOpacity>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Versie 1.0</Text>
      </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },
  headerSpace: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0f2fe",
  },
  itemTextWrap: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  placeholderCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  versionContainer: {
    marginTop: 24,
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  versionText: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
});
