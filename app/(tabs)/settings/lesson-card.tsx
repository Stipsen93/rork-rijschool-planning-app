import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight, Plus, Pencil, Trash2, X } from "lucide-react-native";
import { useLessonCard, LessonCardItem, StatusConfig } from "@/components/settings/LessonCardStore";

type EditMode =
  | { type: "none" }
  | { type: "add-category" }
  | { type: "edit-category"; categoryId: string; name: string }
  | { type: "add-item"; categoryId: string }
  | { type: "edit-item"; categoryId: string; item: LessonCardItem }
  | { type: "edit-status"; statusIndex: number; status: StatusConfig };

export default function LessonCardScreen() {
  const insets = useSafeAreaInsets();
  const {
    categories,
    statusConfig,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    updateStatusConfig,
  } = useLessonCard();

  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>({ type: "none" });
  const [inputText, setInputText] = useState<string>("");
  const [descriptionText, setDescriptionText] = useState<string>("");
  const [colorInput, setColorInput] = useState<string>("");

  const handleAddCategory = async () => {
    if (!inputText.trim()) return;
    await addCategory(inputText.trim());
    setInputText("");
    setEditMode({ type: "none" });
  };

  const handleEditCategory = async (categoryId: string) => {
    if (!inputText.trim()) return;
    await updateCategory(categoryId, inputText.trim());
    setInputText("");
    setEditMode({ type: "none" });
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    Alert.alert(
      "Categorie verwijderen",
      `Weet je zeker dat je "${categoryName}" wilt verwijderen?`,
      [
        { text: "Annuleren", style: "cancel" },
        {
          text: "Verwijderen",
          style: "destructive",
          onPress: async () => {
            await deleteCategory(categoryId);
            if (expandedCategoryId === categoryId) {
              setExpandedCategoryId(null);
            }
          },
        },
      ]
    );
  };

  const handleAddItem = async (categoryId: string) => {
    if (!inputText.trim()) return;
    await addItem(categoryId, inputText.trim());
    setInputText("");
    setEditMode({ type: "none" });
  };

  const handleEditItem = async (categoryId: string, itemId: string) => {
    if (!inputText.trim()) return;
    await updateItem(categoryId, itemId, inputText.trim(), descriptionText.trim() || undefined);
    setInputText("");
    setDescriptionText("");
    setEditMode({ type: "none" });
  };

  const handleDeleteItem = (categoryId: string, itemId: string, itemName: string) => {
    Alert.alert(
      "Item verwijderen",
      `Weet je zeker dat je "${itemName}" wilt verwijderen?`,
      [
        { text: "Annuleren", style: "cancel" },
        {
          text: "Verwijderen",
          style: "destructive",
          onPress: async () => {
            await deleteItem(categoryId, itemId);
          },
        },
      ]
    );
  };

  const handleEditStatus = async (statusIndex: number) => {
    if (!inputText.trim() || !colorInput.trim()) return;
    const updated = statusConfig.map((s, idx) =>
      idx === statusIndex
        ? { symbol: inputText.trim(), label: descriptionText.trim(), color: colorInput.trim() }
        : s
    );
    await updateStatusConfig(updated);
    setInputText("");
    setDescriptionText("");
    setColorInput("");
    setEditMode({ type: "none" });
  };

  const renderEditModal = () => {
    if (editMode.type === "none") return null;

    const title =
      editMode.type === "add-category"
        ? "Categorie toevoegen"
        : editMode.type === "edit-category"
        ? "Categorie bewerken"
        : editMode.type === "add-item"
        ? "Item toevoegen"
        : editMode.type === "edit-item"
        ? "Item bewerken"
        : "Status bewerken";

    const onSave =
      editMode.type === "add-category"
        ? handleAddCategory
        : editMode.type === "edit-category"
        ? () => handleEditCategory(editMode.categoryId)
        : editMode.type === "add-item"
        ? () => handleAddItem(editMode.categoryId)
        : editMode.type === "edit-item"
        ? () => handleEditItem(editMode.categoryId, editMode.item.id)
        : () => handleEditStatus(editMode.statusIndex);

    const showDescription = editMode.type === "edit-item" || editMode.type === "edit-status";
    const showColor = editMode.type === "edit-status";

    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setEditMode({ type: "none" })}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity
                onPress={() => {
                  setInputText("");
                  setDescriptionText("");
                  setEditMode({ type: "none" });
                }}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Naam"
              value={inputText}
              onChangeText={setInputText}
              autoFocus
            />

            {showDescription && (
              <TextInput
                style={[styles.input, editMode.type === "edit-status" ? {} : styles.textArea]}
                placeholder={editMode.type === "edit-status" ? "Label" : "Beschrijving (optioneel)"}
                value={descriptionText}
                onChangeText={setDescriptionText}
                multiline={editMode.type !== "edit-status"}
                numberOfLines={editMode.type !== "edit-status" ? 4 : 1}
                textAlignVertical={editMode.type !== "edit-status" ? "top" : "center"}
              />
            )}

            {showColor && (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Kleur (bijv. #3b82f6)"
                  value={colorInput}
                  onChangeText={setColorInput}
                />
                <View style={styles.colorPreview}>
                  <View style={[styles.colorPreviewCircle, { backgroundColor: colorInput || "#d1d5db" }]} />
                  <Text style={styles.colorPreviewText}>Voorbeeld kleur</Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setInputText("");
                  setDescriptionText("");
                  setColorInput("");
                  setEditMode({ type: "none" });
                }}
              >
                <Text style={styles.cancelButtonText}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                <Text style={styles.saveButtonText}>Opslaan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Leskaart</Text>
            <Text style={styles.headerSubtitle}>
              Beheer categorieën en lesonderdelen voor je lessen
            </Text>
          </View>

          {categories.map((category) => {
            const isExpanded = expandedCategoryId === category.id;

            return (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <TouchableOpacity
                    style={styles.categoryTouchable}
                    onPress={() => {
                      setExpandedCategoryId(isExpanded ? null : category.id);
                    }}
                  >
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>{category.items.length} items</Text>
                  </TouchableOpacity>

                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => {
                        setInputText(category.name);
                        setEditMode({ type: "edit-category", categoryId: category.id, name: category.name });
                      }}
                    >
                      <Pencil size={18} color="#0ea5e9" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeleteCategory(category.id, category.name)}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setExpandedCategoryId(isExpanded ? null : category.id);
                      }}
                    >
                      <ChevronRight
                        size={20}
                        color="#9ca3af"
                        style={{
                          transform: [{ rotate: isExpanded ? "90deg" : "0deg" }],
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.itemsContainer}>
                    {category.items.map((item) => (
                      <View key={item.id} style={styles.itemRow}>
                        <TouchableOpacity
                          style={styles.itemTouchable}
                          onPress={() => {
                            setInputText(item.name);
                            setDescriptionText(item.description || "");
                            setEditMode({ type: "edit-item", categoryId: category.id, item });
                          }}
                        >
                          <Text style={styles.itemName}>{item.name}</Text>
                          {item.description && (
                            <Text style={styles.itemDescription} numberOfLines={2}>
                              {item.description}
                            </Text>
                          )}
                        </TouchableOpacity>

                        <View style={styles.itemActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => {
                              setInputText(item.name);
                              setDescriptionText(item.description || "");
                              setEditMode({ type: "edit-item", categoryId: category.id, item });
                            }}
                          >
                            <Pencil size={16} color="#0ea5e9" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleDeleteItem(category.id, item.id, item.name)}
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    <TouchableOpacity
                      style={styles.addItemButton}
                      onPress={() => {
                        setInputText("");
                        setEditMode({ type: "add-item", categoryId: category.id });
                      }}
                    >
                      <Plus size={16} color="#0ea5e9" />
                      <Text style={styles.addItemText}>Item toevoegen</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          <View style={styles.statusConfigSection}>
            <Text style={styles.sectionTitle}>Status Iconen</Text>
            <Text style={styles.sectionSubtitle}>Pas de iconen, namen en kleuren van de statussen aan</Text>
            <View style={styles.statusConfigList}>
              {statusConfig.map((status, idx) => (
                <View key={idx} style={styles.statusConfigItem}>
                  <View style={[styles.statusIconCircle, { backgroundColor: status.color }]}>
                    <Text style={styles.statusIconText}>{status.symbol}</Text>
                  </View>
                  <View style={styles.statusConfigInfo}>
                    <Text style={styles.statusConfigLabel}>{status.label}</Text>
                    <Text style={styles.statusConfigColor}>{status.color}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      setInputText(status.symbol);
                      setDescriptionText(status.label);
                      setColorInput(status.color);
                      setEditMode({ type: "edit-status", statusIndex: idx, status });
                    }}
                  >
                    <Pencil size={18} color="#0ea5e9" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={() => {
              setInputText("");
              setEditMode({ type: "add-category" });
            }}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addCategoryText}>Categorie toevoegen</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {renderEditModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },
  header: {
    marginBottom: 8,
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: "hidden",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  categoryTouchable: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: "#9ca3af",
  },
  categoryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemTouchable: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#f0f9ff",
  },
  addItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0ea5e9",
  },
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#0ea5e9",
    marginTop: 8,
  },
  addCategoryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
  },
  textArea: {
    minHeight: 100,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#0ea5e9",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  statusConfigSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },
  statusConfigList: {
    gap: 12,
  },
  statusConfigItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    gap: 12,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIconText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  statusConfigInfo: {
    flex: 1,
  },
  statusConfigLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  statusConfigColor: {
    fontSize: 12,
    color: "#6b7280",
  },
  colorPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  colorPreviewCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  colorPreviewText: {
    fontSize: 13,
    color: "#6b7280",
  },
});
