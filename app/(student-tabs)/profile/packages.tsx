import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { trpc } from "@/lib/trpc";
import { Clock, Euro, Package, ShoppingBag, CheckCircle2, AlertCircle } from "lucide-react-native";

export default function PackagesScreen() {
  const packagesQuery = trpc.students.packages.useQuery();

  if (packagesQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: "Pakketten & Producten" }} />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Laden...</Text>
      </View>
    );
  }

  if (packagesQuery.error) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: "Pakketten & Producten" }} />
        <AlertCircle color="#ef4444" size={48} />
        <Text style={styles.errorText}>
          {packagesQuery.error.message || "Fout bij laden"}
        </Text>
      </View>
    );
  }

  const { packages, products, summary } = packagesQuery.data || {
    packages: [],
    products: [],
    summary: { totalHoursRemaining: 0, totalHoursUsed: 0, totalPriceRemaining: 0 },
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Pakketten & Producten" }} />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Totaal Overzicht</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Clock color="#2563EB" size={24} />
              <Text style={styles.summaryValue}>{summary.totalHoursRemaining.toFixed(1)} uur</Text>
              <Text style={styles.summaryLabel}>Resterende uren</Text>
            </View>
            <View style={styles.summaryItem}>
              <CheckCircle2 color="#10b981" size={24} />
              <Text style={styles.summaryValue}>{summary.totalHoursUsed.toFixed(1)} uur</Text>
              <Text style={styles.summaryLabel}>Gebruikt</Text>
            </View>
            <View style={styles.summaryItem}>
              <Euro color="#f59e0b" size={24} />
              <Text style={styles.summaryValue}>€{summary.totalPriceRemaining.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Nog te betalen</Text>
            </View>
          </View>
        </View>

        {packages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package color="#2563EB" size={24} />
              <Text style={styles.sectionTitle}>Mijn Pakketten</Text>
            </View>

            {packages.map((pkg: any) => {
              const packageInfo = pkg.package;
              const hoursPercentage = (pkg.hours_used / pkg.total_hours) * 100;
              const pricePercentage = (pkg.price_paid / pkg.price_total) * 100;

              return (
                <View key={pkg.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{packageInfo?.name || "Pakket"}</Text>
                    <View style={[styles.statusBadge, getStatusStyle(pkg.status)]}>
                      <Text style={styles.statusText}>{getStatusLabel(pkg.status)}</Text>
                    </View>
                  </View>

                  {packageInfo?.description && (
                    <Text style={styles.cardDescription}>{packageInfo.description}</Text>
                  )}

                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Uren</Text>
                      <Text style={styles.progressValue}>
                        {pkg.hours_used.toFixed(1)} / {pkg.total_hours.toFixed(1)} uur
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[styles.progressFill, { width: `${hoursPercentage}%` }]}
                      />
                    </View>
                    <Text style={styles.progressRemaining}>
                      {pkg.hours_remaining.toFixed(1)} uur over
                    </Text>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Betaling</Text>
                      <Text style={styles.progressValue}>
                        €{pkg.price_paid.toFixed(2)} / €{pkg.price_total.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[styles.progressFillPrice, { width: `${pricePercentage}%` }]}
                      />
                    </View>
                    <Text style={styles.progressRemaining}>
                      €{pkg.price_remaining.toFixed(2)} nog te betalen
                    </Text>
                  </View>

                  {pkg.start_date && (
                    <Text style={styles.cardDate}>
                      Gestart op: {new Date(pkg.start_date).toLocaleDateString("nl-NL")}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {products.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ShoppingBag color="#10b981" size={24} />
              <Text style={styles.sectionTitle}>Mijn Producten</Text>
            </View>

            {products.map((prod: any) => {
              const productInfo = prod.product;
              const quantityPercentage = (prod.quantity_used / prod.quantity) * 100;
              const pricePercentage = (prod.price_paid / prod.price_total) * 100;

              return (
                <View key={prod.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{productInfo?.name || "Product"}</Text>
                    <View style={[styles.statusBadge, getStatusStyle(prod.status)]}>
                      <Text style={styles.statusText}>{getStatusLabel(prod.status)}</Text>
                    </View>
                  </View>

                  {productInfo?.description && (
                    <Text style={styles.cardDescription}>{productInfo.description}</Text>
                  )}

                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{getCategoryLabel(productInfo?.category)}</Text>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Gebruikt</Text>
                      <Text style={styles.progressValue}>
                        {prod.quantity_used} / {prod.quantity}
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[styles.progressFill, { width: `${quantityPercentage}%` }]}
                      />
                    </View>
                    <Text style={styles.progressRemaining}>
                      {prod.quantity_remaining} over
                    </Text>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Betaling</Text>
                      <Text style={styles.progressValue}>
                        €{prod.price_paid.toFixed(2)} / €{prod.price_total.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[styles.progressFillPrice, { width: `${pricePercentage}%` }]}
                      />
                    </View>
                    <Text style={styles.progressRemaining}>
                      €{prod.price_remaining.toFixed(2)} nog te betalen
                    </Text>
                  </View>

                  {prod.purchase_date && (
                    <Text style={styles.cardDate}>
                      Gekocht op: {new Date(prod.purchase_date).toLocaleDateString("nl-NL")}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {packages.length === 0 && products.length === 0 && (
          <View style={styles.emptyState}>
            <Package color="#9ca3af" size={64} />
            <Text style={styles.emptyTitle}>Geen pakketten of producten</Text>
            <Text style={styles.emptyDescription}>
              Je hebt nog geen pakketten of producten toegewezen gekregen.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Actief",
    completed: "Voltooid",
    expired: "Verlopen",
    cancelled: "Geannuleerd",
    used: "Gebruikt",
  };
  return labels[status] || status;
}

function getStatusStyle(status: string) {
  switch (status) {
    case "active":
      return { backgroundColor: "#dcfce7" };
    case "completed":
      return { backgroundColor: "#dbeafe" };
    case "expired":
      return { backgroundColor: "#fef3c7" };
    case "cancelled":
      return { backgroundColor: "#fee2e2" };
    case "used":
      return { backgroundColor: "#e0e7ff" };
    default:
      return { backgroundColor: "#f3f4f6" };
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    exam: "Examen",
    theory: "Theorie",
    material: "Materiaal",
    other: "Overig",
  };
  return labels[category] || category;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1f2937",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  cardDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#0284c7",
  },
  progressSection: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2563EB",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 4,
  },
  progressFillPrice: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  progressRemaining: {
    fontSize: 12,
    color: "#6b7280",
  },
  cardDate: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic" as const,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
