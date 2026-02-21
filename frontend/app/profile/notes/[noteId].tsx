import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { usePreventScreenCapture } from "expo-screen-capture";
import { useTranslation } from "react-i18next";
import { useApi } from "../../../hooks/useApi";
import { useColors } from "../../../hooks/useColors";
import { useLocalizedField } from "../../../hooks/useLocalizedField";
import { useNoteRewardedAd } from "../../../hooks/useNoteRewardedAd";
import {
  buildInAppNoteViewerUrl,
  requestNoteAccess,
} from "../../../services/api/notes";
import type { Note } from "../../../types/note.types";

const PDF_JS_CDN_BASE = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";

function buildPdfViewerHtml(pdfUrl: string): string {
  const safePdfUrl = JSON.stringify(pdfUrl);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title>PDF Viewer</title>
    <style>
      body {
        margin: 0;
        background: #0f172a;
        color: #e2e8f0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #status {
        padding: 12px;
        text-align: center;
        font-size: 14px;
      }
      #viewer {
        padding: 8px;
      }
      canvas {
        display: block;
        max-width: 100%;
        height: auto;
        margin: 0 auto 10px auto;
        background: #fff;
        border-radius: 4px;
      }
    </style>
    <script src="${PDF_JS_CDN_BASE}/pdf.min.js"></script>
  </head>
  <body>
    <div id="status">Loading preview...</div>
    <div id="viewer"></div>
    <script>
      (function () {
        var pdfUrl = ${safePdfUrl};
        var statusEl = document.getElementById("status");
        var viewerEl = document.getElementById("viewer");
        if (!window.pdfjsLib) {
          statusEl.textContent = "Preview is unavailable.";
          return;
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "${PDF_JS_CDN_BASE}/pdf.worker.min.js";

        function renderPage(pdf, pageNumber) {
          return pdf.getPage(pageNumber).then(function (page) {
            var viewport = page.getViewport({ scale: 1 });
            var targetWidth = Math.max(320, Math.min(window.innerWidth - 16, 1080));
            var scale = targetWidth / viewport.width;
            var scaledViewport = page.getViewport({ scale: scale });
            var outputScale = window.devicePixelRatio || 1;

            var canvas = document.createElement("canvas");
            var cssWidth = Math.floor(scaledViewport.width);
            var cssHeight = Math.floor(scaledViewport.height);
            canvas.style.width = cssWidth + "px";
            canvas.style.height = cssHeight + "px";
            canvas.width = Math.floor(cssWidth * outputScale);
            canvas.height = Math.floor(cssHeight * outputScale);
            var ctx = canvas.getContext("2d");
            viewerEl.appendChild(canvas);

            var renderContext = {
              canvasContext: ctx,
              viewport: scaledViewport,
            };
            if (outputScale !== 1) {
              renderContext.transform = [outputScale, 0, 0, outputScale, 0, 0];
            }

            return page.render(renderContext).promise;
          });
        }

        window.pdfjsLib
          .getDocument({ url: pdfUrl })
          .promise
          .then(function (pdf) {
            statusEl.textContent = "";
            var chain = Promise.resolve();
            for (var i = 1; i <= pdf.numPages; i += 1) {
              (function (pageNumber) {
                chain = chain.then(function () {
                  return renderPage(pdf, pageNumber);
                });
              })(i);
            }
            return chain;
          })
          .catch(function () {
            statusEl.textContent = "Preview is unavailable.";
          });
      })();
    </script>
  </body>
</html>`;
}

export default function NoteReaderScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const { ensureViewAccess } = useNoteRewardedAd();
  usePreventScreenCapture();

  const params = useLocalSearchParams<{ noteId: string | string[] }>();
  const noteId = useMemo(() => {
    if (Array.isArray(params.noteId)) return params.noteId[0];
    return params.noteId;
  }, [params.noteId]);
  const numericId = Number.parseInt(noteId || "", 10);

  const { data: note, status } = useApi<Note>(
    Number.isFinite(numericId) ? `/api/notes/${numericId}/` : "",
    !Number.isFinite(numericId),
  );
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(numericId)) return;
    let isMounted = true;

    async function loadAccess() {
      setAccessLoading(true);
      setAccessError(null);
      try {
        const granted = await ensureViewAccess(numericId);
        if (!granted) {
          if (isMounted) {
            setAccessError(
              t("notes.completeAdToOpen", {
                defaultValue: "Please complete the ad to open this note.",
              }),
            );
          }
          return;
        }
        const response = await requestNoteAccess(numericId);
        if (isMounted) {
          setViewerUrl(response.viewer_url);
        }
      } catch (error) {
        if (isMounted) {
          setAccessError(
            error instanceof Error
              ? error.message
              : t("notes.failedToLoad", { defaultValue: "Failed to load note." }),
          );
        }
      } finally {
        if (isMounted) setAccessLoading(false);
      }
    }

    loadAccess();
    return () => {
      isMounted = false;
    };
  }, [numericId, ensureViewAccess, t]);

  const isPdfDocument = note?.document_type === "PDF";

  const resolvedViewerUrl = useMemo(() => {
    if (!viewerUrl) return "";
    if (isPdfDocument) return viewerUrl;
    return buildInAppNoteViewerUrl(viewerUrl);
  }, [viewerUrl, isPdfDocument]);

  const pdfViewerHtml = useMemo(() => {
    if (!viewerUrl || !isPdfDocument) return "";
    return buildPdfViewerHtml(viewerUrl);
  }, [viewerUrl, isPdfDocument]);

  const handleShouldStartLoadWithRequest = useCallback(
    (request: { url: string }) => {
      const url = request.url;
      if (!url || url === "about:blank") return true;
      if (isPdfDocument) {
        if (viewerUrl && url.startsWith(viewerUrl)) return true;
        if (url.startsWith("https://cdnjs.cloudflare.com/")) return true;
        if (url.startsWith("blob:")) return true;
        if (url.startsWith("data:")) return true;
        return false;
      }
      if (viewerUrl && url.startsWith(viewerUrl)) return true;
      if (url.startsWith("https://docs.google.com/")) return true;
      if (url.startsWith("https://docs.googleusercontent.com/")) return true;
      if (url.startsWith("https://www.gstatic.com/")) return true;
      return false;
    },
    [viewerUrl, isPdfDocument],
  );

  const isLoading = status === "loading" || accessLoading;
  const pageTitle = note ? lf(note.title_en, note.title_np || note.title_en) : t("notes.reader", { defaultValue: "Note Reader" });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {pageTitle}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {t("notes.inAppOnly", { defaultValue: "In-app view only · screenshots blocked where supported" })}
          </Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!isLoading && accessError && (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {accessError}
          </Text>
        </View>
      )}

      {!isLoading && !accessError && resolvedViewerUrl && (
        <WebView
          source={
            isPdfDocument
              ? { html: pdfViewerHtml, baseUrl: resolvedViewerUrl }
              : { uri: resolvedViewerUrl }
          }
          style={styles.viewer}
          startInLoadingState
          cacheEnabled={false}
          incognito
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures={false}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  errorText: {
    textAlign: "center",
    fontSize: 14,
  },
  viewer: {
    flex: 1,
  },
});
