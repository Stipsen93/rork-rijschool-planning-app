import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Camera, Save, User } from "lucide-react-native";

interface ProfileData {
  full_name: string;
  email: string;
  phone_number: string;
  certification_number: string;
  school_name: string;
  birth_date?: string | null;
  title: string;
  experienceYears: string;
  taxId: string;
  address: string;
  iban: string;
  specializations: {
    manual: boolean;
    automatic: boolean;
    highway: boolean;
    examPrep: boolean;
  };
  notifications: {
    sms: boolean;
    email: boolean;
    bookingRequests: boolean;
  };
  profileImageUrl?: string | null;
}

const initialProfile: ProfileData = {
  full_name: "",
  email: "",
  phone_number: "",
  certification_number: "",
  school_name: "",
  birth_date: null,
  title: "Gecertificeerd Rijinstructeur",
  experienceYears: "8",
  taxId: "NL123456789B01",
  address: "Hoofdstraat 123, 1234 AB Amsterdam",
  iban: "NL91 ABNA 0417 1643 00",
  specializations: { manual: true, automatic: false, highway: true, examPrep: true },
  notifications: { sms: true, email: false, bookingRequests: true },
  profileImageUrl: undefined,
};

export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [changed, setChanged] = useState<boolean>(false);
  const [profile, setProfile] = useState<ProfileData>({ ...initialProfile });

  useEffect(() => {
    let mounted = true;
    console.log("Loading profile data...");
    const t = setTimeout(() => {
      if (!mounted) return;
      setProfile((p) => ({
        ...p,
        full_name: "Jan van der Berg",
        email: "jan.berg@example.com",
        phone_number: "+31 6 1234 5678",
        certification_number: "WRM-123456",
        school_name: "Rijschool Amsterdam",
        birth_date: "1985-05-12",
        profileImageUrl: "https://images.unsplash.com/photo-1603415526960-f7e0328d13f1?w=300&q=80&auto=format",
      }));
      setLoading(false);
    }, 500);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, []);

  const onChange = useCallback(<K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setChanged(true);
  }, []);

  const onSpecChange = useCallback((key: keyof ProfileData["specializations"], value: boolean) => {
    setProfile((prev) => ({ ...prev, specializations: { ...prev.specializations, [key]: value } }));
    setChanged(true);
  }, []);

  const onNotifChange = useCallback((key: keyof ProfileData["notifications"], value: boolean) => {
    setProfile((prev) => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }));
    setChanged(true);
  }, []);

  const handleSave = useCallback(() => {
    if (saving) return;
    console.log("Saving profile...", profile);
    if (!profile.full_name || !profile.email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      Alert.alert("Ongeldige gegevens", "Vul een geldige naam en e-mail in.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setChanged(false);
      Alert.alert("Succes", "Profiel wijzigingen opgeslagen");
      router.back();
    }, 800);
  }, [profile, saving, router]);

  const pickImage = useCallback(() => {
    Alert.alert(
      Platform.OS === "web" ? "Niet beschikbaar" : "Mock",
      Platform.OS === "web"
        ? "Camera/Galerij is niet beschikbaar in deze preview."
        : "In de echte app zou hier de image picker openen.",
      [
        { text: "Kies voorbeeld", onPress: () => onChange("profileImageUrl", "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80&auto=format") },
        { text: "Annuleer" },
      ]
    );
  }, [onChange]);

  if (loading) {
    return (
      <View style={styles.loading} testID="profile-loading">
        <Text style={styles.loadingText}>Profiel laden...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} testID="profile-screen">
          <View style={styles.avatarWrap}>
            {profile.profileImageUrl ? (
              <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User color="#0ea5e9" size={48} />
              </View>
            )}
            <TouchableOpacity onPress={pickImage} style={styles.cameraBtn} accessibilityRole="button" testID="pick-image">
              <Camera color="#fff" size={16} />
            </TouchableOpacity>
            <Text style={styles.avatarTitle}>Profielfoto</Text>
            <Text style={styles.avatarHint}>Tik om je foto te wijzigen</Text>
          </View>

          <Section title="Persoonlijke Gegevens">
            <Field label="Volledige naam" value={profile.full_name} onChangeText={(t) => onChange("full_name", t)} testID="field-name" />
            <Field label="Email" value={profile.email} keyboardType="email-address" onChangeText={(t) => onChange("email", t)} testID="field-email" />
            <Field label="Telefoon" value={profile.phone_number} keyboardType="phone-pad" onChangeText={(t) => onChange("phone_number", t)} testID="field-phone" />
            <Field label="Geboortedatum" value={profile.birth_date ? new Date(profile.birth_date).toLocaleDateString() : "Selecteer datum"} onFocus={() => Alert.alert("Datum", "Datumkiezer zou hier openen")} editable={false} testID="field-birth" />
            <Field label="Professionele titel" value={profile.title} onChangeText={(t) => onChange("title", t)} testID="field-title" />
          </Section>

          <Section title="Professionele Informatie">
            <Field label="WRM Pasnummer" value={profile.certification_number} onChangeText={(t) => onChange("certification_number", t)} testID="field-cert" />
            <Field label="Rijschool affiliatie" value={profile.school_name} onChangeText={(t) => onChange("school_name", t)} testID="field-school" />
            <Field label="Jaren ervaring" value={profile.experienceYears} keyboardType="number-pad" onChangeText={(t) => onChange("experienceYears", t)} testID="field-exp" />

            <Text style={styles.subTitle}>Specialisaties</Text>
            <Toggle label="Handgeschakelde transmissie" value={profile.specializations.manual} onChange={(v) => onSpecChange("manual", v)} testID="spec-manual" />
            <Toggle label="Automatische transmissie" value={profile.specializations.automatic} onChange={(v) => onSpecChange("automatic", v)} testID="spec-automatic" />
            <Toggle label="Snelweg training" value={profile.specializations.highway} onChange={(v) => onSpecChange("highway", v)} testID="spec-highway" />
            <Toggle label="Examen voorbereiding" value={profile.specializations.examPrep} onChange={(v) => onSpecChange("examPrep", v)} testID="spec-exam" />
          </Section>

          <Section title="Contact Voorkeuren">
            <Toggle label="SMS berichten" value={profile.notifications.sms} onChange={(v) => onNotifChange("sms", v)} testID="notif-sms" />
            <Toggle label="Email berichten" value={profile.notifications.email} onChange={(v) => onNotifChange("email", v)} testID="notif-email" />
            <Text style={styles.subTitle}>Beschikbaarheid notificaties</Text>
            <Toggle label="Boekingsverzoek notificaties" value={profile.notifications.bookingRequests} onChange={(v) => onNotifChange("bookingRequests", v)} testID="notif-booking" />
          </Section>

          <Section title="Zakelijke Informatie">
            <Field label="BTW nummer" value={profile.taxId} onChangeText={(t) => onChange("taxId", t)} testID="field-tax" />
            <Field label="Zakelijk adres" value={profile.address} onChangeText={(t) => onChange("address", t)} multiline testID="field-address" />
            <Field label="IBAN rekeningnummer" value={profile.iban} onChangeText={(t) => onChange("iban", t)} testID="field-iban" />
          </Section>

          <TouchableOpacity style={[styles.saveCta, (!changed || saving) && styles.saveCtaDisabled]} onPress={handleSave} disabled={!changed || saving} testID="save-profile-bottom">
            <Text style={styles.saveCtaText}>{saving ? "Opslaan..." : "Wijzigingen opslaan"}</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  editable?: boolean;
  multiline?: boolean;
  testID?: string;
  onFocus?: () => void;
}

function Field({ label, value, onChangeText, keyboardType = "default", editable = true, multiline = false, testID, onFocus }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        testID={testID}
        style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        placeholder={label}
        onFocus={onFocus}
      />
    </View>
  );
}

function Toggle({ label, value, onChange, testID }: { label: string; value: boolean; onChange: (v: boolean) => void; testID?: string }) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={() => onChange(!value)}
      style={styles.toggleRow}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.switch, value ? styles.switchOn : styles.switchOff]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, color: "#6b7280" },
  avatarWrap: { alignItems: "center", gap: 6 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { backgroundColor: "#e5f3ff", alignItems: "center", justifyContent: "center" },
  cameraBtn: {
    position: "absolute",
    right: 100 - 24,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0ea5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  avatarHint: { fontSize: 12, color: "#6b7280" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0ea5e9" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, color: "#6b7280" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  inputDisabled: { backgroundColor: "#f3f4f6" },
  subTitle: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  toggleLabel: { fontSize: 15 },
  switch: { width: 42, height: 26, borderRadius: 13, backgroundColor: "#e5e7eb" },
  switchOn: { backgroundColor: "#0ea5e9" },
  switchOff: { backgroundColor: "#e5e7eb" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#0ea5e9",
    borderRadius: 20,
  },
  saveBtnDisabled: { backgroundColor: "#93c5fd" },
  saveText: { color: "#fff", fontWeight: "700" },
  saveCta: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveCtaDisabled: { backgroundColor: "#93c5fd" },
  saveCtaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
