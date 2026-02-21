import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Card, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { usePaginatedApi } from "../../../hooks/usePaginatedApi";
import { useColors } from "../../../hooks/useColors";
import { useLocalizedField } from "../../../hooks/useLocalizedField";
import { useNoteRewardedAd } from "../../../hooks/useNoteRewardedAd";
import type { Note } from "../../../types/note.types";

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NotesLibraryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const { ensureViewAccess, ensureDownloadAccess, isDownloaded } = useNoteRewardedAd();

  const { data: notes, status, refetch } = usePaginatedApi<Note>("/api/notes/?ordering=-created_at");

  const sortedNotes = useMemo(() => {
    return [...(notes || [])].sort((a, b) => {
      if (a.status === "APPROVED" && b.status !== "APPROVED") return -1;
      if (a.status !== "APPROVED" && b.status === "APPROVED") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notes]);

  const onView = async (note: Note) => {
    const access = await ensureViewAccess(note.id);
    if (!access) {
      Alert.alert(
        t("notes.rewardNeeded", { defaultValue: "Reward required" }),
        t("notes.completeAdToOpen", {
          defaultValue: "Please complete the ad to open this note.",
        }),
      );
      return;
    }
    router.push(`/profile/notes/${note.id}` as any);
  };

  const onDownload = async (note: Note) => {
    const access = await ensureDownloadAccess(note.id);
    if (!access) {
      Alert.alert(
        t("notes.rewardNeeded", { defaultValue: "Reward required" }),
        t("notes.completeAdToDownload", {
          defaultValue: "Please complete the ad to save this note in your library.",
        }),
      );
      return;
    }
    Alert.alert(
      t("notes.saved", { defaultValue: "Saved" }),
      t("notes.savedNoMoreAds", {
        defaultValue: "This note is now saved in-app. No more ads for opening it.",
      }),
    );
  };

  if (status === "loading") {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t("notes.library", { defaultValue: "Notes Library" })}
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {t("notes.policy", {
                defaultValue:
                  "Notes are readable only inside the app. Files are not exposed for direct download.",
              })}
            </Text>
          </Card.Content>
        </Card>

        {sortedNotes.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="file-document-outline" size={34} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t("notes.empty", { defaultValue: "No notes available yet." })}
            </Text>
          </View>
        ) : (
          sortedNotes.map((note) => {
            const downloaded = isDownloaded(note.id);
            const localizedTitle = lf(note.title_en, note.title_np || note.title_en);
            return (
              <Card key={note.id} style={[styles.noteCard, { backgroundColor: colors.surface }]}>
                <Card.Content>
                  <View style={styles.titleRow}>
                    <Text style={[styles.noteTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                      {localizedTitle}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            note.status === "APPROVED"
                              ? colors.success + "18"
                              : note.status === "REJECTED"
                                ? colors.error + "18"
                                : colors.warning + "18",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              note.status === "APPROVED"
                                ? colors.success
                                : note.status === "REJECTED"
                                  ? colors.error
                                  : colors.warning,
                          },
                        ]}
                      >
                        {note.status.replace("_", " ")}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {note.category_name || t("common.unknown", { defaultValue: "Unknown category" })} · {note.document_type} ·{" "}
                    {formatSize(note.file_size)}
                  </Text>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => onView(note)}
                    >
                      <MaterialCommunityIcons name="book-open-page-variant" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>
                        {t("notes.open", { defaultValue: "Open" })}
                      </Text>
                    </TouchableOpacity>

                    {!downloaded && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                        onPress={() => onDownload(note)}
                      >
                        <MaterialCommunityIcons name="download" size={16} color="#fff" />
                        <Text style={styles.actionBtnText}>
                          {t("notes.download", { defaultValue: "Download" })}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {downloaded && (
                      <View style={[styles.savedChip, { backgroundColor: colors.success + "18" }]}>
                        <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
                        <Text style={[styles.savedChipText, { color: colors.success }]}>
                          {t("notes.savedLabel", { defaultValue: "Saved" })}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  infoCard: {
    borderRadius: 14,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  empty: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  noteCard: {
    borderRadius: 14,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  noteTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  metaText: {
    fontSize: 12,
    marginTop: 8,
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  savedChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  savedChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

