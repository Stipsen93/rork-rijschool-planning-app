import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";

type PersonalInfo = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  address: string;
  phoneNumber: string;
  parentName: string;
  parentPhoneNumber: string;
};

export default function PersonalInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const studentId = params.id as string;
  const insets = useSafeAreaInsets();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [info, setInfo] = useState<PersonalInfo>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    address: "",
    phoneNumber: "",
    parentName: "",
    parentPhoneNumber: "",
  });

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  useEffect(() => {
    (async () => {
      try {
        const key = `student_personal_info_${studentId}`;
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as PersonalInfo;
          setInfo(parsed);
          console.log("[PersonalInfo] Loaded personal info", parsed);
        }
      } catch (e) {
        console.log("[PersonalInfo] Failed to load personal info", e);
      }
    })();
  }, [studentId]);

  const saveInfo = useCallback(async () => {
    try {
      const key = `student_personal_info_${studentId}`;
      await AsyncStorage.setItem(key, JSON.stringify(info));
      console.log("[PersonalInfo] Saved personal info");
      setIsEditing(false);
    } catch (e) {
      console.log("[PersonalInfo] Failed to save personal info", e);
    }
  }, [info, studentId]);

  const calculateAge = useCallback((dob: string): string => {
    if (!dob) return "";
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} jaar`;
    } catch {
      return "";
    }
  }, []);

  const onDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTempDate(selectedDate);
      setInfo((prev) => ({ ...prev, dateOfBirth: selectedDate.toISOString() }));
    }
  }, []);

  const confirmDateWeb = useCallback(() => {
    setInfo((prev) => ({ ...prev, dateOfBirth: tempDate.toISOString() }));
    setShowDatePicker(false);
  }, [tempDate]);

  const cancelDateWeb = useCallback(() => {
    setShowDatePicker(false);
  }, []);

  const formatDateDisplay = useCallback((iso: string): string => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return "";
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <Stack.Screen options={{ title: "Persoonlijke Informatie", headerBackTitle: "Terug" }} />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
        <View style={styles.card}>
          <Text style={styles.label}>Voornaam</Text>
          <TextInput
            value={info.firstName}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, firstName: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Voornaam"
            editable={isEditing}
            testID="input-firstName"
          />

          <Text style={styles.label}>Achternaam</Text>
          <TextInput
            value={info.lastName}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, lastName: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Achternaam"
            editable={isEditing}
            testID="input-lastName"
          />

          <Text style={styles.label}>Geboortedatum</Text>
          <TouchableOpacity
            onPress={() => {
              if (!isEditing) return;
              if (info.dateOfBirth) {
                setTempDate(new Date(info.dateOfBirth));
              }
              setShowDatePicker(true);
            }}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            disabled={!isEditing}
            testID="input-dateOfBirth"
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[styles.inputText, !info.dateOfBirth && styles.placeholderText]}>
                {info.dateOfBirth ? formatDateDisplay(info.dateOfBirth) : "Selecteer datum"}
              </Text>
              {info.dateOfBirth && <Text style={styles.ageText}>{calculateAge(info.dateOfBirth)}</Text>}
            </View>
          </TouchableOpacity>

          {showDatePicker && Platform.OS !== "web" && (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {showDatePicker && Platform.OS === "web" && (
            <View style={styles.datePickerWeb}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <TouchableOpacity onPress={cancelDateWeb} style={[styles.btn, styles.btnSecondary, { flex: 1 }]}>
                  <Text style={styles.btnSecondaryText}>Annuleren</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmDateWeb} style={[styles.btn, styles.btnPrimary, { flex: 1 }]}>
                  <Text style={styles.btnPrimaryText}>Bevestigen</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.label}>E-mailadres</Text>
          <TextInput
            value={info.email}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, email: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="E-mailadres"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={isEditing}
            testID="input-email"
          />

          <Text style={styles.label}>Woonadres</Text>
          <TextInput
            value={info.address}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, address: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Woonadres"
            editable={isEditing}
            testID="input-address"
          />

          <Text style={styles.label}>Mobiele nummer</Text>
          <TextInput
            value={info.phoneNumber}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, phoneNumber: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Mobiele nummer"
            keyboardType="phone-pad"
            editable={isEditing}
            testID="input-phoneNumber"
          />

          <Text style={styles.label}>Naam ouders/contactpersoon</Text>
          <TextInput
            value={info.parentName}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, parentName: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Naam ouders/contactpersoon"
            editable={isEditing}
            testID="input-parentName"
          />

          <Text style={styles.label}>Nummer van ouders/contactpersoon</Text>
          <TextInput
            value={info.parentPhoneNumber}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, parentPhoneNumber: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Nummer van ouders/contactpersoon"
            keyboardType="phone-pad"
            editable={isEditing}
            testID="input-parentPhoneNumber"
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!isEditing ? (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            style={[styles.btn, styles.btnPrimary]}
            testID="edit-btn"
          >
            <Text style={styles.btnPrimaryText}>Bewerken</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={saveInfo}
            style={[styles.btn, styles.btnPrimary]}
            testID="save-btn"
          >
            <Text style={styles.btnPrimaryText}>Opslaan</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  label: {
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  inputText: {
    fontSize: 16,
    color: "#111827",
  },
  placeholderText: {
    color: "#9ca3af",
  },
  ageText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563eb",
  },
  datePickerWeb: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: "#2f95dc",
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  btnSecondary: {
    backgroundColor: "#e5e7eb",
  },
  btnSecondaryText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 16,
  },
});
