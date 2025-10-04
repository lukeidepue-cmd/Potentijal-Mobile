// app/(tabs)/profile/index.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  Dimensions,
  FlatList,
  ViewToken,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ---- Fonts ---- */
import {
  useFonts as useGeist,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
} from "@expo-google-fonts/geist";
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

/* aliases */
const FONT = {
  uiRegular: "Geist_400Regular",
  uiMedium: "Geist_500Medium",
  uiSemi: "Geist_600SemiBold",
  uiBold: "Geist_700Bold",
  uiXBold: "Geist_800ExtraBold",
  displayMed: "SpaceGrotesk_600SemiBold",
  displayBold: "SpaceGrotesk_700Bold",
};

/* ---- Theme ---- */
const DARK = "#0A0F14";
const CARD = "#111822";
const TEXT = "#E6F1FF";
const DIM = "#8AA0B5";
const GREEN = "#2BF996";
const STROKE = "#1A2430";

type Highlight = { id: string; uri: string };

/** Back-compat shim: prefer new `MediaType`, fall back to deprecated `MediaTypeOptions` */
const hasNewMediaType = !!(ImagePicker as any).MediaType;
const mediaTypesImage = hasNewMediaType
  ? { mediaTypes: [(ImagePicker as any).MediaType.image] }
  : { mediaTypes: ImagePicker.MediaTypeOptions.Images };
const mediaTypesVideo = hasNewMediaType
  ? { mediaTypes: [(ImagePicker as any).MediaType.video] }
  : { mediaTypes: ImagePicker.MediaTypeOptions.Videos };

export default function Profile() {
  const [geistLoaded] = useGeist({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold,
  });
  const [sgLoaded] = useSpaceGrotesk({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const fontsReady = geistLoaded && sgLoaded;

  /* -------- Profile data -------- */
  const [name] = useState("Troy Hornbreck");
  const [handle] = useState("@thetroyhornbreck67");
  const [followers] = useState(207);
  const [following] = useState(310);
  const [bio] = useState("Montverde Academy  ’25  PG");

  /* -------- Avatar -------- */
  const [pfpUri, setPfpUri] = useState<string | null>(null);
  const pickPfp = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      ...(mediaTypesImage as any),
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    } as any);
    if (!res.canceled) setPfpUri(res.assets[0].uri);
  };

  /* -------- Highlights (local) -------- */
  const [clips, setClips] = useState<Highlight[]>([]);
  const addHighlight = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      ...(mediaTypesVideo as any),
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    } as any);
    if (!res.canceled) {
      const added = res.assets.map((a) => ({ id: `${a.uri}-${Date.now()}`, uri: a.uri }));
      setClips((prev) => [...prev, ...added]);
    }
  };

  /* -------- Fullscreen viewer -------- */
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const players = useRef<Map<number, Video | null>>(new Map());
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!viewerOpen) return;
    players.current.forEach((ref, idx) => {
      if (!ref) return;
      if (idx === currentIndex) ref.playAsync().catch(() => {});
      else ref.pauseAsync().catch(() => {});
    });
  }, [currentIndex, viewerOpen]);

  const openViewer = (idx: number) => {
    setStartIndex(idx);
    setCurrentIndex(idx);
    setViewerOpen(true);
  };

  const deleteCurrent = () => {
    setClips((prev) => {
      const next = [...prev];
      next.splice(currentIndex, 1);
      if (next.length === 0) {
        setViewerOpen(false);
        return next;
      }
      const newIdx = Math.min(currentIndex, next.length - 1);
      setCurrentIndex(newIdx);
      return next;
    });
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length) {
        const idx = viewableItems[0].index ?? 0;
        setCurrentIndex(idx);
      }
    }
  ).current;

  const viewConfig = useMemo(() => ({ itemVisiblePercentThreshold: 80 }), []);

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: DARK, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const highlightCount = clips.length; // (used for “Highlights” stat)

  /* ---------------------------- UI ---------------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: DARK }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 28, // CHANGE (SPACING): distance from last content to bottom (above tab bar)
          paddingTop: 44,    // CHANGE (SPACING): top inset above "Profile" heading
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Heading (Space Grotesk) */}
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={styles.headerRule} />

        {/* Top row */}
        <View style={styles.topRow}>
          <Pressable style={styles.pfpWrap} onPress={pickPfp}>
            {pfpUri ? (
              <Image source={{ uri: pfpUri }} style={styles.pfpImg} />
            ) : (
              <View style={styles.pfpPlaceholder}>
                <Ionicons name="add" size={28} color={DIM} />
              </View>
            )}
          </Pressable>

          <View style={{ flex: 1, marginLeft: 16 /* CHANGE (SPACING): gap between avatar and name/handle */ }}>
            {/* Display name (Geist) */}
            <Text style={styles.displayName}>{name}</Text>
            {/* Handle (system) */}
            <Text style={styles.handle}>{handle}</Text>
          </View>
        </View>

        {/* Bio moved directly under name/avatar */}
        <View
          style={styles.bioCard}
          /* CHANGE (SPACING): bioCard.marginTop controls space between Name/Handle row and Bio block;
             bioCard.padding controls internal breathing room */
        >
          <Text style={styles.sectionHeading}>Bio</Text>
          <View style={{ height: 10 /* CHANGE (SPACING): space between "Bio" label and bio text */ }} />
          <Text style={styles.bioText}>{bio}</Text>
        </View>

        {/* Followers / Following / Highlights */}
        <View
          style={styles.ffRowOuter}
          /* CHANGE (SPACING): ffRowOuter.marginTop is space between Bio block and stats row */
        >
          <View style={styles.ffCol}>
            <Text style={styles.ffLabel /* CHANGE (TYPO/SPACE): label baseline offset via marginBottom */}>Followers</Text>
            <Text style={styles.ffNumber}>{followers}</Text>
          </View>
          <View style={styles.ffCol}>
            <Text style={styles.ffLabel}>Following</Text>
            <Text style={styles.ffNumber}>{following}</Text>
          </View>
          <View style={styles.ffCol}>
            <Text style={styles.ffLabel}>Highlights</Text>
            <Text style={styles.ffNumber}>{highlightCount}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View
          style={styles.btnRow}
          /* CHANGE (SPACING): btnRow.marginTop is space above buttons; marginBottom is space below buttons */
        >
          <Pressable style={[styles.pillBtn, styles.pillSolid]} onPress={() => router.push("./edit")}>
            <Text style={[styles.pillText, { color: TEXT }]}>Edit Profile</Text>
          </Pressable>
          <Pressable style={[styles.pillBtn, styles.pillSolid]} onPress={addHighlight}>
            <Text style={[styles.pillText, { color: TEXT }]}>Add Highlights</Text>
          </Pressable>
        </View>

        {/* Highlights */}
        <Text
          style={[styles.sectionHeading, { marginTop: 18 }]}
          /* CHANGE (SPACING): this marginTop is the gap between Buttons row and "Highlights" heading */
        >
          Highlights
        </Text>

        {clips.length === 0 ? (
          <View
            style={styles.emptyCard}
            /* CHANGE (SPACING): emptyCard.marginTop = gap between heading and empty state card; paddingVertical = card height */
          >
            <Ionicons name="videocam-outline" size={28} color={DIM} />
            <Text style={{ color: DIM, marginTop: 10 /* CHANGE (SPACING): icon-to-text gap */ }}>
              No highlights yet
            </Text>
          </View>
        ) : (
          <Pressable
            style={styles.previewCard}
            onPress={() => openViewer(0)}
            /* CHANGE (SPACING): previewCard.marginTop = gap between heading and video preview */
          >
            <Video
              source={{ uri: clips[0].uri }}
              style={styles.previewVideo}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          </Pressable>
        )}
      </ScrollView>

      {/* Full-screen viewer (unchanged) */}
      <Modal visible={viewerOpen} animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View style={styles.viewer}>
          <FlatList
            data={clips}
            keyExtractor={(it) => it.id}
            initialScrollIndex={startIndex}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item, index }) => (
              <View style={{ height: Dimensions.get("window").height }}>
                <Video
                  ref={(r) => {
                    players.current.set(index, r);
                  }}
                  source={{ uri: item.uri }}
                  style={styles.fullVideo}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={index === currentIndex}
                  isLooping
                  isMuted={false}
                />
              </View>
            )}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewConfig}
          />

          <Pressable
            onPress={() => setViewerOpen(false)}
            style={[styles.navBtn, styles.backBtn, { top: insets.top + 10, left: 10 }]}
          >
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </Pressable>

          <Pressable
            onPress={deleteCurrent}
            style={[styles.navBtn, styles.trashBtn, { top: insets.top + 10, right: 10 }]}
          >
            <Ionicons name="trash-outline" size={22} color="#FFF" />
          </Pressable>

          <View style={[styles.hintWrap, { bottom: (insets.bottom || 0) + 20 }]}>
            <Text style={styles.hintText}>Scroll to see more highlights</Text>
            <Ionicons name="chevron-down" size={18} color="#FFF" style={{ marginTop: 2, opacity: 0.8 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------------------- Styles ---------------------------- */
const styles = StyleSheet.create({
  // "Profile" -> Space Grotesk
  pageTitle: {
    color: TEXT,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    fontFamily: FONT.displayBold,
  },
  headerRule: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    marginVertical: 10, // CHANGE (SPACING): space above and below the rule under "Profile"
    alignSelf: "stretch",
  },

  topRow: { flexDirection: "row", alignItems: "center", marginTop: 10 /* CHANGE (SPACING): gap above avatar/name row */ },

  pfpWrap: {
    width: 140,  // size only (kept from last version)
    height: 140, // size only
    borderRadius: 70,
    borderWidth: 2,
    borderColor: STROKE,
    overflow: "hidden",
    backgroundColor: "#0C1117",
  },
  pfpImg: { width: "100%", height: "100%" },
  pfpPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Display name -> Geist
  displayName: {
    color: TEXT,
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 34,
    fontFamily: FONT.uiBold,
  },
  // Handle -> system
  handle: {
    color: DIM,
    marginTop: 4, // CHANGE (SPACING): vertical gap between name and handle
    fontSize: 16,
  },

  // “Invisible box” for bio
  bioCard: {
    marginTop: 24, // CHANGE (SPACING): space between Name/Handle row and Bio block
    padding: 12,   // CHANGE (SPACING): inner padding of the Bio block
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STROKE,
    backgroundColor: CARD,
  },

  // Section headings -> Geist
  sectionHeading: { color: GREEN, fontSize: 22, fontWeight: "900", fontFamily: FONT.uiBold },

  // Bio description -> system
  bioText: { color: TEXT, fontSize: 14 },

  // Stats row (Followers / Following / Highlights)
  ffRowOuter: {
    marginTop: 22,            // CHANGE (SPACING): gap between Bio block and stats row
    flexDirection: "row",
    justifyContent: "space-between", // spread across full width
    alignItems: "flex-end",
  },
  ffCol: { alignItems: "center", flex: 1 },
  ffLabel: {
    color: DIM,
    fontSize: 12,
    marginBottom: -8, // CHANGE (SPACING): move label closer/farther from the number baseline
  },
  ffNumber: { color: TEXT, fontSize: 28, fontWeight: "900", fontFamily: FONT.uiBold },

  // Buttons row
  btnRow: {
    flexDirection: "row",
    gap: 12,        // CHANGE (SPACING): space between "Edit Profile" and "Add Highlights"
    marginTop: 18,  // CHANGE (SPACING): gap above buttons (from stats row)
    marginBottom: 4 // CHANGE (SPACING): gap below buttons (before "Highlights" header)
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 8, // CHANGE (SPACING): button vertical padding
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  pillSolid: {
    backgroundColor: "#22272E",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },
  pillText: { fontSize: 16, fontWeight: "900", fontFamily: FONT.uiBold },

  emptyCard: {
    marginTop: 16,     // CHANGE (SPACING): gap between "Highlights" header and empty state card
    borderRadius: 16,
    borderWidth: 1,
    borderColor: STROKE,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32, // CHANGE (SPACING): height/air inside the empty card
  },

  previewCard: {
    marginTop: 10, // CHANGE (SPACING): gap between "Highlights" header and video preview
    borderRadius: 16,
    borderWidth: 1,
    borderColor: STROKE,
    overflow: "hidden",
    backgroundColor: CARD,
  },
  previewVideo: { width: "100%", height: 280 },

  /* Viewer */
  viewer: { flex: 1, backgroundColor: "black" },
  fullVideo: { width: "100%", height: "100%", backgroundColor: "black" },

  navBtn: {
    position: "absolute",
    zIndex: 1000,
    elevation: 8,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  backBtn: { left: 10 },
  trashBtn: {
    right: 10,
    backgroundColor: "#B00020",
    borderColor: "rgba(255,255,255,0.18)",
  },

  hintWrap: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    zIndex: 10,
  },
  hintText: { color: "#FFF", opacity: 0.9, fontSize: 14, marginBottom: 2 },
});

























