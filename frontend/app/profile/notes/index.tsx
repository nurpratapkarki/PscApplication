import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Text } from "react-native-paper";
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

const DOC_TYPE_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  PDF: "file-pdf-box",
  DOC: "file-word",
  DOCX: "file-word",
  PPT: "file-powerpoint",
  PPTX: "file-powerpoint",
  TXT: "file-document-outline",
};

const DOC_TYPE_COLOR: Record<string, string> = {
  PDF: "#E63946",
  DOC: "#2E5A8F",
  DOCX: "#2E5A8F",
  PPT: "#F59E0B",
  PPTX: "#F59E0B",
  TXT: "#64748B",
};

// ── Note Card ─────────────────────────────────────────────────────────────────
function NoteCard({
  note,
  colors,
  lf,
  t,
  downloaded,
  onView,
  onDownload,
}: {
  note: Note;
  colors: ReturnType<typeof useColors>;
  lf: ReturnType<typeof useLocalizedField>;
  t: (key: string, opts?: any) => string;
  downloaded: boolean;
  onView: () => void;
  onDownload: () => void;
}) {
  const localizedTitle = lf(note.title_en, note.title_np || note.title_en);
  const docType = note.document_type?.toUpperCase() || "PDF";
  const docIcon = DOC_TYPE_ICON[docType] || "file-document-outline";
  const docColor = DOC_TYPE_COLOR[docType] || colors.primary;
  const isApproved = note.status === "APPROVED";

  return (
    <TouchableOpacity
      style={[cardStyles.card, { backgroundColor: colors.surface }]}
      onPress={onView}
      activeOpacity={0.85}
    >
      {/* Left — doc type icon */}
      <View style={[cardStyles.docIcon, { backgroundColor: docColor + "15" }]}>
        <MaterialCommunityIcons name={docIcon} size={28} color={docColor} />
        <Text style={[cardStyles.docTypeLabel, { color: docColor }]}>{docType}</Text>
      </View>

      {/* Center — content */}
      <View style={cardStyles.center}>
        <View style={cardStyles.titleRow}>
          <Text style={[cardStyles.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {localizedTitle}
          </Text>
        </View>

        <Text style={[cardStyles.meta, { color: colors.textSecondary }]}>
          {note.category_name || t("common.unknown", { defaultValue: "Uncategorized" })}
          {"  ·  "}
          {formatSize(note.file_size)}
        </Text>

        {/* Status + actions row */}
        <View style={cardStyles.bottomRow}>
          {/* Status pill */}
          <View style={[
            cardStyles.statusPill,
            {
              backgroundColor: isApproved
                ? colors.success + "18"
                : note.status === "REJECTED"
                ? colors.error + "18"
                : colors.warning + "18",
            },
          ]}>
            <MaterialCommunityIcons
              name={isApproved ? "check-circle" : note.status === "REJECTED" ? "close-circle" : "clock-outline"}
              size={10}
              color={isApproved ? colors.success : note.status === "REJECTED" ? colors.error : colors.warning}
            />
            <Text style={[
              cardStyles.statusText,
              {
                color: isApproved ? colors.success : note.status === "REJECTED" ? colors.error : colors.warning,
              },
            ]}>
              {note.status.replace("_", " ")}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={cardStyles.actions}>
            <TouchableOpacity
              style={[cardStyles.openBtn, { backgroundColor: colors.primary }]}
              onPress={onView}
            >
              <MaterialCommunityIcons name="book-open-variant" size={13} color="#fff" />
              <Text style={cardStyles.openBtnText}>{t("notes.open", { defaultValue: "Read" })}</Text>
            </TouchableOpacity>

            {!downloaded ? (
              <TouchableOpacity
                style={[cardStyles.saveBtn, { borderColor: colors.border }]}
                onPress={onDownload}
              >
                <MaterialCommunityIcons name="bookmark-outline" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <View style={[cardStyles.saveBtn, { borderColor: colors.success + "40", backgroundColor: colors.success + "10" }]}>
                <MaterialCommunityIcons name="bookmark-check" size={14} color={colors.success} />
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  docIcon: {
    width: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 4,
  },
  docTypeLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  center: { flex: 1 },
  titleRow: { marginBottom: 4 },
  title: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  meta: { fontSize: 11, marginBottom: 10 },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  openBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  saveBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function NotesLibraryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const { ensureViewAccess, ensureDownloadAccess, isDownloaded } = useNoteRewardedAd();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: notes, status, refetch } = usePaginatedApi<Note>("/api/notes/?ordering=-created_at");

  // Derive unique categories from notes
  const categories = useMemo(() => {
    const cats = new Set<string>();
    (notes || []).forEach((n) => {
      if (n.category_name) cats.add(n.category_name);
    });
    return Array.from(cats).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = [...(notes || [])].sort((a, b) => {
      if (a.status === "APPROVED" && b.status !== "APPROVED") return -1;
      if (a.status !== "APPROVED" && b.status === "APPROVED") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    if (selectedCategory) {
      result = result.filter((n) => n.category_name === selectedCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (n) =>
          n.title_en?.toLowerCase().includes(q) ||
          n.title_np?.toLowerCase().includes(q) ||
          n.category_name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [notes, search, selectedCategory]);

  const approvedCount = useMemo(
    () => (notes || []).filter((n) => n.status === "APPROVED").length,
    [notes]
  );

  const onView = useCallback(async (note: Note) => {
    const access = await ensureViewAccess(note.id);
    if (!access) {
      Alert.alert(
        t("notes.rewardNeeded", { defaultValue: "Reward required" }),
        t("notes.completeAdToOpen", {
          defaultValue: "Please complete the ad to open this note.",
        })
      );
      return;
    }
    router.push(`/profile/notes/${note.id}` as any);
  }, [ensureViewAccess, router, t]);

  const onDownload = useCallback(async (note: Note) => {
    const access = await ensureDownloadAccess(note.id);
    if (!access) {
      Alert.alert(
        t("notes.rewardNeeded", { defaultValue: "Reward required" }),
        t("notes.completeAdToDownload", {
          defaultValue: "Please complete the ad to save this note.",
        })
      );
      return;
    }
    Alert.alert(
      t("notes.saved", { defaultValue: "Saved!" }),
      t("notes.savedNoMoreAds", {
        defaultValue: "Note saved. No more ads needed to open it.",
      })
    );
  }, [ensureDownloadAccess, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Hero band ── */}
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        {/* Top row */}
        <View style={styles.heroTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.heroBackBtn}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitle}>
              {t("notes.library", { defaultValue: "Study Notes" })}
            </Text>
            <View style={styles.heroPill}>
              <MaterialCommunityIcons name="play-circle" size={10} color="#fff" />
              <Text style={styles.heroPillText}>Ad-gated · Read only</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => refetch()}
            style={styles.heroRefreshBtn}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{(notes || []).length}</Text>
            <Text style={styles.heroStatLabel}>Total Notes</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{approvedCount}</Text>
            <Text style={styles.heroStatLabel}>Available</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{categories.length}</Text>
            <Text style={styles.heroStatLabel}>Subjects</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <MaterialCommunityIcons name="magnify" size={18} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder={t("notes.searchPlaceholder", { defaultValue: "Search notes..." })}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <MaterialCommunityIcons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Category filter tabs ── */}
      {categories.length > 0 && (
        <View style={[styles.filterWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {/* All tab */}
            <TouchableOpacity
              style={[
                styles.filterTab,
                {
                  backgroundColor: selectedCategory === null ? colors.primary : colors.background,
                  borderColor: selectedCategory === null ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[
                styles.filterTabText,
                { color: selectedCategory === null ? "#fff" : colors.textSecondary },
              ]}>
                All
              </Text>
              <View style={[
                styles.filterTabCount,
                { backgroundColor: selectedCategory === null ? "rgba(255,255,255,0.25)" : colors.primary + "15" },
              ]}>
                <Text style={[
                  styles.filterTabCountText,
                  { color: selectedCategory === null ? "#fff" : colors.primary },
                ]}>
                  {(notes || []).length}
                </Text>
              </View>
            </TouchableOpacity>

            {categories.map((cat) => {
              const active = selectedCategory === cat;
              const count = (notes || []).filter((n) => n.category_name === cat).length;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterTab,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(active ? null : cat)}
                >
                  <Text style={[
                    styles.filterTabText,
                    { color: active ? "#fff" : colors.textSecondary },
                  ]}>
                    {cat}
                  </Text>
                  <View style={[
                    styles.filterTabCount,
                    { backgroundColor: active ? "rgba(255,255,255,0.25)" : colors.primary + "15" },
                  ]}>
                    <Text style={[
                      styles.filterTabCountText,
                      { color: active ? "#fff" : colors.primary },
                    ]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Content ── */}
      {status === "loading" ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading notes...
          </Text>
        </View>
      ) : filteredNotes.length === 0 ? (
        <View style={styles.centered}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceVariant }]}>
            <MaterialCommunityIcons
              name={search || selectedCategory ? "magnify-close" : "file-document-outline"}
              size={36}
              color={colors.textTertiary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {search || selectedCategory ? "No matches found" : t("notes.empty", { defaultValue: "No notes yet" })}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {search
              ? `No notes match "${search}"`
              : selectedCategory
              ? `No notes in "${selectedCategory}"`
              : "Check back soon for curated study notes"}
          </Text>
          {(search || selectedCategory) && (
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: colors.primary + "15" }]}
              onPress={() => { setSearch(""); setSelectedCategory(null); }}
            >
              <Text style={[styles.clearBtnText, { color: colors.primary }]}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={
            <View style={[styles.infoBar, { backgroundColor: colors.accent + "12", borderColor: colors.accent + "30" }]}>
              <MaterialCommunityIcons name="information-outline" size={14} color={colors.accent} />
              <Text style={[styles.infoText, { color: colors.accent }]}>
                {t("notes.policy", {
                  defaultValue: "Notes are readable only inside the app · not available for download",
                })}
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 32 }} />}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              colors={colors}
              lf={lf}
              t={t}
              downloaded={isDownloaded(item.id)}
              onView={() => onView(item)}
              onDownload={() => onDownload(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },

  // Hero
  hero: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 16, gap: 14 },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  heroTitleWrap: { alignItems: "center", gap: 5 },
  heroTitle: {
    fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.3,
  },
  heroPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  heroPillText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  heroRefreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  // Hero stats
  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14, paddingVertical: 12,
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatValue: { fontSize: 20, fontWeight: "800", color: "#fff" },
  heroStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2, fontWeight: "500" },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },

  // Search
  searchBar: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: "#fff", fontWeight: "500",
  },

  // Filter tabs
  filterWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterTab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
  },
  filterTabText: { fontSize: 12, fontWeight: "600" },
  filterTabCount: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  filterTabCountText: { fontSize: 10, fontWeight: "800" },

  // List
  listContent: { padding: 16, paddingTop: 12 },

  // Info bar
  infoBar: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 12,
  },
  infoText: { flex: 1, fontSize: 11, lineHeight: 17, fontWeight: "500" },

  // Loading
  loadingText: { fontSize: 14, marginTop: 8 },

  // Empty
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  clearBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
  clearBtnText: { fontSize: 13, fontWeight: "700" },
});