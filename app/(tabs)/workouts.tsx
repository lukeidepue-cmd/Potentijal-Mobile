// app/(tabs)/workouts.tsx
// Revamped Workouts tab: pro header + compact set layout + angled inputs + per-mode toolbars
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMode } from "../../providers/ModeContext";
import * as Location from "expo-location";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { theme } from "../../constants/theme";

/* ---------------- Fonts (match Home pages) ---------------- */
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
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

/* ---------------- Types ---------------- */
type ModeKey =
  | "lifting"
  | "basketball"
  | "football"
  | "running"
  | "baseball"
  | "soccer"
  | "hockey"
  | "tennis";

type ItemKind =
  | "exercise"
  // basketball
  | "bb_shot"
  // football
  | "fb_drill"
  | "fb_sprint"
  // soccer
  | "sc_drill"
  | "sc_shoot"
  // baseball
  | "bs_hit"
  | "bs_field"
  // hockey
  | "hk_drill"
  | "hk_shoot"
  // tennis
  | "tn_drill"
  | "tn_rally";

type SetRecord = Record<string, string>;
type AnyItem = { id: string; kind: ItemKind; name: string; sets: SetRecord[] };
type DraftTuple = readonly [AnyItem[], React.Dispatch<React.SetStateAction<AnyItem[]>>];

/* ---------------- Helpers ---------------- */
const uid = () => Math.random().toString(36).slice(2, 9);

/** Field templates per kind (order = vertical stacking) */
const FIELD_SETS: Record<ItemKind, { key: string; label: string; numeric?: boolean }[]> = {
  // Shared
  exercise: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "weight", label: "Weight (lb)", numeric: true },
  ],
  // Basketball
  bb_shot: [
    { key: "attempted", label: "Attempted", numeric: true },
    { key: "made", label: "Made", numeric: true },
  ],
  // Football
  fb_drill: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "completed", label: "Completed", numeric: true },
  ],
  fb_sprint: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
    { key: "avgTime", label: "Avg. Time", numeric: false },
  ],
  // Soccer
  sc_drill: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "time", label: "Time", numeric: false },
  ],
  sc_shoot: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
  ],
  // Baseball
  bs_hit: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "avgDistance", label: "Avg. Distance", numeric: true },
  ],
  bs_field: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
  ],
  // Hockey
  hk_drill: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "time", label: "Time", numeric: false },
  ],
  hk_shoot: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
  ],
  // Tennis
  tn_drill: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "time", label: "Time", numeric: false },
  ],
  tn_rally: [
    { key: "points", label: "Points", numeric: true },
    { key: "time", label: "Time", numeric: false },
  ],
};

/* ---------------- Running helpers ---------------- */
type Pt = { lat: number; lon: number; ts: number; acc?: number };
const toRad = (d: number) => (d * Math.PI) / 180;
function haversine(a: Pt, b: Pt): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function sumDistanceM(points: Pt[]): number {
  let m = 0;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const q = points[i];
    if (q.acc !== undefined && q.acc > 50) continue;
    const d = haversine(p, q);
    if (d < 100) m += d;
  }
  return m;
}
const mToMi = (m: number) => m / 1609.344;
const paceStr = (secPerMile: number | null) =>
  secPerMile == null || !isFinite(secPerMile) || secPerMile <= 0
    ? "—"
    : `${Math.floor(secPerMile / 60)}:${String(Math.round(secPerMile % 60)).padStart(2, "0")}/mi`;
const timeStr = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

/* ---------------- Fonts map ---------------- */
const FONT = {
  displayMed: "SpaceGrotesk_600SemiBold",
  displayBold: "SpaceGrotesk_700Bold", // Font 3
  uiRegular: "Geist_400Regular",
  uiMedium: "Geist_500Medium",
  uiSemi: "Geist_600SemiBold", // Font 2 (chips)
  uiBold: "Geist_700Bold",
  uiXBold: "Geist_800ExtraBold",
} as const;

/* ============================================================================
   Screen
============================================================================ */
export default function WorkoutsScreen() {
  const { mode } = useMode();
  const m = (mode || "lifting").toLowerCase() as ModeKey;

  // Load fonts to match Home pages
  const [geistLoaded] = useGeist({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold,
  });
  const [sgLoaded] = useSpaceGrotesk({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const fontsReady = geistLoaded && sgLoaded;

  /* ---------- top meta ---------- */
  const [isCreating, setIsCreating] = useState(false);
  const [workoutName, setWorkoutName] = useState("");

  /* ---------- per-mode drafts ---------- */
  const [liftDraft, setLiftDraft] = useState<AnyItem[]>([]);
  const [bbDraft, setBbDraft] = useState<AnyItem[]>([]);
  const [fbDraft, setFbDraft] = useState<AnyItem[]>([]);
  const [bsDraft, setBsDraft] = useState<AnyItem[]>([]);
  const [scDraft, setScDraft] = useState<AnyItem[]>([]);
  const [hkDraft, setHkDraft] = useState<AnyItem[]>([]);
  const [tnDraft, setTnDraft] = useState<AnyItem[]>([]);
  const [runDraft, setRunDraft] = useState<AnyItem[]>([]); // placeholder list

  const drafts: Record<ModeKey, DraftTuple> = {
    lifting: [liftDraft, setLiftDraft],
    basketball: [bbDraft, setBbDraft],
    football: [fbDraft, setFbDraft],
    running: [runDraft, setRunDraft],
    baseball: [bsDraft, setBsDraft],
    soccer: [scDraft, setScDraft],
    hockey: [hkDraft, setHkDraft],
    tennis: [tnDraft, setTnDraft],
  };

  const [list, setList] = drafts[m];

  /* ---------- actions ---------- */
  const addItem = (kind: ItemKind) => {
    const empty: SetRecord = {};
    FIELD_SETS[kind].forEach((f) => (empty[f.key] = ""));
    setList((cur) => [...cur, { id: uid(), kind, name: "", sets: [{ ...empty }] }]);
  };

  const updateName = (id: string, name: string) =>
    setList((cur) => cur.map((x) => (x.id === id ? { ...x, name } : x)));

  const removeItem = (id: string) => setList((cur) => cur.filter((x) => x.id !== id));

  const addSet = (id: string) => {
    const item = list.find((x) => x.id === id);
    if (!item) return;
    const empty: SetRecord = {};
    FIELD_SETS[item.kind].forEach((f) => (empty[f.key] = ""));
    setList((cur) => cur.map((x) => (x.id === id ? { ...x, sets: [...x.sets, { ...empty }] } : x)));
  };

  const updateSet = (id: string, index: number, key: string, value: string) => {
    setList((cur) =>
      cur.map((x) =>
        x.id !== id
          ? x
          : { ...x, sets: x.sets.map((s, i) => (i === index ? { ...s, [key]: value } : s)) }
      )
    );
  };

  const saveWorkout = () => {
    if (!workoutName.trim()) {
      Alert.alert("Name your workout", "Please give your workout a name.");
      return;
    }
    if (list.length === 0) {
      Alert.alert("Add something first", "Add at least one square.");
      return;
    }
    Alert.alert("Saved!", "Workout added to your recent list.");
    setList([]);
    setIsCreating(false);
    setWorkoutName("");
  };

  /* ---------- Running state ---------- */
  type RunState = "idle" | "tracking" | "paused" | "finished";
  const [runState, setRunState] = useState<RunState>("idle");
  const [points, setPoints] = useState<Pt[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const locSub = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<any>(null);

  const distanceM = useMemo(() => sumDistanceM(points), [points]);
  const distanceMi = useMemo(() => mToMi(distanceM), [distanceM]);
  const avgPaceSec = useMemo(
    () => (distanceMi > 0 ? Math.round(elapsed / distanceMi) : null),
    [elapsed, distanceMi]
  );
  const currentPaceSec = useMemo(() => {
    if (points.length < 2) return null;
    let d = 0;
    let i = points.length - 1;
    const end = points[i];
    while (i > 0 && d < 100) {
      d += haversine(points[i - 1], points[i]);
      i--;
    }
    const dt = (end.ts - points[i].ts) / 1000;
    if (d < 30 || dt <= 0) return null;
    const mi = mToMi(d);
    return Math.round(dt / mi);
  }, [points]);

  const region: Region = useMemo(
    () =>
      points.length
        ? {
            latitude: points[points.length - 1].lat,
            longitude: points[points.length - 1].lon,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          }
        : {
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
    [points]
  );

  useEffect(() => {
    return () => {
      if (locSub.current) locSub.current.remove();
      if (timerRef.current) clearInterval(timerRef.current);
      locSub.current = null;
      timerRef.current = null;
    };
  }, []);

  const startRun = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location needed", "Enable location to track your run.");
      return;
    }
    try {
      const cur = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setPoints([
        {
          lat: cur.coords.latitude,
          lon: cur.coords.longitude,
          ts: Date.now(),
          acc: cur.coords.accuracy ?? undefined,
        },
      ]);
    } catch {}
    locSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) =>
        setPoints((prev) => [
          ...prev,
          {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
            ts: Date.now(),
            acc: loc.coords.accuracy ?? undefined,
          },
        ])
    );
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    setRunState("tracking");
  };
  const pauseRun = () => {
    if (locSub.current) {
      locSub.current.remove();
      locSub.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunState("paused");
  };
  const resumeRun = async () => {
    setRunState("tracking");
    locSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) =>
        setPoints((prev) => [
          ...prev,
          {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
            ts: Date.now(),
            acc: loc.coords.accuracy ?? undefined,
          },
        ])
    );
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };
  const endRun = () => {
    if (locSub.current) {
      locSub.current.remove();
      locSub.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunState("finished");
  };
  const saveRun = () => {
    setRunState("idle");
    setPoints([]);
    setElapsed(0);
    Alert.alert("Saved!", "Run added to your recent list.");
  };

  /* ---------- sport icon (right pill) ---------- */
  const RightIcon = () => {
    const iconProps = { size: 18, color: theme.colors.textHi } as const;
    const inner = (() => {
      switch (m) {
        case "lifting":
          return <Ionicons name="barbell-outline" {...iconProps} />;
        case "basketball":
          return <Ionicons name="basketball-outline" {...iconProps} />;
        case "football":
          return <Ionicons name="american-football-outline" {...iconProps} />;
        case "running":
          return <Ionicons name="walk-outline" {...iconProps} />;
        case "soccer":
          return <Ionicons name="football-outline" {...iconProps} />;
        case "baseball":
          return <Ionicons name="baseball-outline" {...iconProps} />;
        case "hockey":
          return <MaterialCommunityIcons name="hockey-sticks" size={18} color={theme.colors.textHi} />;
        case "tennis":
          return <MaterialCommunityIcons name="tennis" size={18} color={theme.colors.textHi} />;
        default:
          return <Ionicons name="barbell-outline" {...iconProps} />;
      }
    })();
    return (
      <View style={styles.iconPill}>
        {inner}
      </View>
    );
  };

  /* ---------- toolbar (name + “green boxes”) ---------- */
  const Toolbar = () => {
    if (m === "running") {
      return (
        <Pressable onPress={startRun} style={styles.addWorkoutBtn}>
          <Text style={[styles.addWorkoutText, { fontFamily: FONT.displayBold }]}>+ Start Run</Text>
        </Pressable>
      );
    }

    if (!isCreating) {
      return (
        <Pressable
          onPress={() => {
            setIsCreating(true);
            setWorkoutName("");
          }}
          style={styles.addWorkoutBtn}
        >
          <Text style={[styles.addWorkoutText, { fontFamily: FONT.displayBold }]}>+ Add Workout</Text>
        </Pressable>
      );
    }

    const Button = ({ label, onPress, flex = 1 }: { label: string; onPress: () => void; flex?: number }) => (
      <Pressable onPress={onPress} style={[styles.topBtn, { flex }]}>
        <Text style={[styles.topBtnText, { fontFamily: FONT.uiSemi }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );

    // first row: workout name full width
    const nameRow = (
      <TextInput
        key="name"
        value={workoutName}
        onChangeText={setWorkoutName}
        placeholder="Workout name…"
        placeholderTextColor={theme.colors.textLo}
        style={styles.nameInput}
      />
    );

    // second row: per-mode green boxes
    const rowBtns: React.ReactNode[] = [];
    if (m === "lifting") {
      rowBtns.push(<Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} />);
    } else if (m === "basketball") {
      rowBtns.push(<Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} />);
      rowBtns.push(<Button key="+shot" label="+ Shooting" onPress={() => addItem("bb_shot")} />);
      rowBtns.push(<Button key="+drill" label="+ Drill" onPress={() => addItem("sc_drill")} />);
    } else if (m === "football") {
      rowBtns.push(<Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} />);
      rowBtns.push(<Button key="+drill" label="+ Drill" onPress={() => addItem("fb_drill")} />);
      rowBtns.push(<Button key="+spr" label="+ Sprints" onPress={() => addItem("fb_sprint")} />);
    } else if (m === "soccer") {
      rowBtns.push(<Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} />);
      rowBtns.push(<Button key="+drill" label="+ Drill" onPress={() => addItem("sc_drill")} />);
      rowBtns.push(<Button key="+shoot" label="+ Shooting" onPress={() => addItem("sc_shoot")} />);
    } else if (m === "baseball") {
      rowBtns.push(<Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} />);
      rowBtns.push(<Button key="+hit" label="+ Hitting" onPress={() => addItem("bs_hit")} />);
      rowBtns.push(<Button key="+field" label="+ Fielding" onPress={() => addItem("bs_field")} />);
    } else if (m === "hockey") {
      rowBtns.push(<Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} />);
      rowBtns.push(<Button key="+drill" label="+ Drill" onPress={() => addItem("hk_drill")} />);
      rowBtns.push(<Button key="+shoot" label="+ Shooting" onPress={() => addItem("hk_shoot")} />);
    } else if (m === "tennis") {
      rowBtns.push(<Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} />);
      rowBtns.push(<Button key="+drill" label="+ Drill" onPress={() => addItem("tn_drill")} />);
      rowBtns.push(<Button key="+rally" label="+ Rally" onPress={() => addItem("tn_rally")} />);
    }

    return (
      <>
        <View style={{ marginTop: 8 }}>{nameRow}</View>
        <View style={[styles.row, { marginTop: 8 }]}>{rowBtns}</View>
      </>
    );
  };

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg0, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1, backgroundColor: theme.colors.bg0 }}
    >
      {/* Header (centered title, right sport icon) */}
      <View style={{ paddingHorizontal: theme.layout.xl, paddingTop: theme.layout.lg, marginTop: 30 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {/* left spacer keeps title centered */}
          <View style={{ width: 48, height: 48 }} />
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={styles.header}>Workouts</Text>
            <View style={styles.headerUnderline} />
          </View>
          <RightIcon />
        </View>
        <Toolbar />
      </View>

      {/* BODY */}
      <ScrollView
        style={{ flex: 1, marginTop: theme.layout.lg }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.xl,
          paddingVertical: theme.layout.lg,
          paddingBottom: 120,
          gap: theme.layout.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Non-running: full-width cards */}
        {m !== "running" &&
          list.map((item) => (
            <FullWidthCard
              key={item.id}
              item={item}
              onRemove={() => removeItem(item.id)}
              onName={(v) => updateName(item.id, v)}
              onAddSet={() => addSet(item.id)}
              onChange={(setIdx, key, v) => updateSet(item.id, setIdx, key, v)}
            />
          ))}

        {/* Running section */}
        {m === "running" && (
          <RunningSection
            runState={runState}
            region={region}
            points={points}
            startRun={startRun}
            pauseRun={pauseRun}
            resumeRun={resumeRun}
            endRun={endRun}
            saveRun={saveRun}
            elapsed={elapsed}
            distanceMi={mToMi(sumDistanceM(points))}
            avgPaceSec={avgPaceSec}
            currentPaceSec={currentPaceSec}
          />
        )}
      </ScrollView>

      {/* Sticky bottom save (non-running, when creating) */}
      {m !== "running" && isCreating && (
        <View style={styles.stickySaveWrap}>
          <Pressable onPress={saveWorkout} style={styles.bigSaveBtn}>
            <Text style={[styles.bigSaveText, { fontFamily: FONT.displayBold }]}>Save Workout</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

/* ================= Card (square) ================= */
function FullWidthCard({
  item,
  onRemove,
  onName,
  onAddSet,
  onChange,
}: {
  item: AnyItem;
  onRemove: () => void;
  onName: (v: string) => void;
  onAddSet: () => void;
  onChange: (setIdx: number, key: string, value: string) => void;
}) {
  const fields = FIELD_SETS[item.kind];

  // shot % (basketball)
  const pctFor = (s: SetRecord) => {
    const a = parseInt(s.attempted || "0", 10) || 0;
    const m = parseInt(s.made || "0", 10) || 0;
    return a > 0 ? Math.round((m / a) * 100) : null;
  };

  return (
    <View style={styles.card}>
      {/* cut-in name row */}
      <View style={styles.cardHeader}>
        <TextInput
          value={item.name}
          onChangeText={onName}
          placeholder={
            item.kind === "exercise"
              ? "Exercise name…"
              : item.kind.endsWith("_drill")
              ? "Drill name…"
              : "Name…"
          }
          placeholderTextColor={theme.colors.textLo}
          style={styles.cardName}
        />
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={{ color: theme.colors.textLo, fontWeight: "800" }}>×</Text>
        </Pressable>
      </View>

      {/* Set+ chip */}
      <Pressable onPress={onAddSet} style={styles.setChip}>
        <Text style={[styles.setChipText, { fontFamily: FONT.uiSemi }]}>Set +</Text>
      </Pressable>

      {/* sets in 2 columns */}
      <View style={styles.setGrid}>
        {item.sets.map((s, idx) => (
          <View key={idx} style={styles.setTile}>
            <Text style={[styles.setBadge, { fontFamily: FONT.displayMed }]}>Set {idx + 1}</Text>

            {fields.map((f) => (
              <AngledInput
                key={f.key}
                placeholder={f.label}
                value={s[f.key] ?? ""}
                onChangeText={(t) => onChange(idx, f.key, f.numeric ? t.replace(/[^\d.]/g, "") : t)}
                keyboardType={f.numeric ? "numeric" : "default"}
              />
            ))}

            {item.kind === "bb_shot" && (
              <Text style={styles.shotPct}>{(() => {
                const p = pctFor(s);
                return p == null ? "—" : `${p}%`;
              })()}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

/* Angled / “Tennessee” input: skewed wrapper + counter-skewed TextInput so text is straight */
function AngledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={styles.angledWrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textLo}
        keyboardType={keyboardType}
        style={styles.angledInput}
      />
    </View>
  );
}

/* ================= Running section ================= */
function RunningSection(props: {
  runState: "idle" | "tracking" | "paused" | "finished";
  region: Region;
  points: Pt[];
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  endRun: () => void;
  saveRun: () => void;
  elapsed: number;
  distanceMi: number;
  avgPaceSec: number | null;
  currentPaceSec: number | null;
}) {
  const {
    runState,
    region,
    points,
    startRun,
    pauseRun,
    resumeRun,
    endRun,
    saveRun,
    elapsed,
    distanceMi,
    avgPaceSec,
    currentPaceSec,
  } = props;

  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.card, { overflow: "hidden" }]}>
        <View style={{ height: 380 }}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={region}
            region={region}
            showsUserLocation
            followsUserLocation={runState === "tracking"}
            showsMyLocationButton={false}
          >
            {points.length >= 2 && (
              <Polyline
                coordinates={points.map((p) => ({ latitude: p.lat, longitude: p.lon }))}
                strokeColor={theme.colors.primary600}
                strokeWidth={4}
              />
            )}
            {points.length > 0 && (
              <Marker coordinate={{ latitude: points[points.length - 1].lat, longitude: points[points.length - 1].lon }} />
            )}
          </MapView>
        </View>
      </View>

      {runState !== "idle" && (
        <View style={[styles.card, { padding: 12, gap: 10 }]}>
          <Text style={{ color: theme.colors.textLo, textAlign: "center" }}>
            {runState === "tracking" ? "Running" : runState === "paused" ? "Paused" : "Finished"}
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={[styles.metric, { flex: 1 }]}>
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricValue}>{distanceMi.toFixed(2)} mi</Text>
            </View>
            <View style={[styles.metric, { flex: 1 }]}>
              <Text style={styles.metricLabel}>Calories</Text>
              <Text style={styles.metricValue}>{Math.round(distanceMi * 100)}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={[styles.metric, { flex: 1 }]}>
              <Text style={styles.metricLabel}>Current Pace</Text>
              <Text style={styles.metricValue}>{paceStr(currentPaceSec)}</Text>
            </View>
            <View style={[styles.metric, { flex: 1 }]}>
              <Text style={styles.metricLabel}>Avg Pace</Text>
              <Text style={styles.metricValue}>{paceStr(avgPaceSec)}</Text>
            </View>
          </View>

          {runState === "tracking" && (
            <View style={styles.ctrlRow}>
              <Pressable onPress={pauseRun} style={[styles.ctrlBtn, styles.ctrlHollow]}>
                <Text style={[styles.ctrlText, { color: theme.colors.textHi }]}>Pause</Text>
              </Pressable>
              <Pressable onPress={endRun} style={[styles.ctrlBtn, { backgroundColor: theme.colors.danger }]}>
                <Text style={[styles.ctrlText, { color: "#fff" }]}>End Run</Text>
              </Pressable>
            </View>
          )}
          {runState === "paused" && (
            <View style={styles.ctrlRow}>
              <Pressable onPress={resumeRun} style={[styles.ctrlBtn, { backgroundColor: theme.colors.primary600 }]}>
                <Text style={[styles.ctrlText, { color: "#052d1b" }]}>Resume</Text>
              </Pressable>
              <Pressable onPress={endRun} style={[styles.ctrlBtn, { backgroundColor: theme.colors.danger }]}>
                <Text style={[styles.ctrlText, { color: "#fff" }]}>End Run</Text>
              </Pressable>
            </View>
          )}
          {runState === "finished" && (
            <View style={styles.ctrlRow}>
              <Pressable onPress={saveRun} style={[styles.ctrlBtn, { backgroundColor: theme.colors.primary600 }]}>
                <Text style={[styles.ctrlText, { color: "#052d1b" }]}>Save Run</Text>
              </Pressable>
            </View>
          )}

          <Text style={{ color: theme.colors.textHi, textAlign: "center", fontSize: 24, fontFamily: FONT.displayBold, marginTop: 4 }}>
            Time: {timeStr(elapsed)}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ============================================================================
   Styles
============================================================================ */
const styles = StyleSheet.create({
  /* header */
  header: {
    color: theme.colors.textHi,
    fontSize: 28,
    letterSpacing: 0.2,
    fontFamily: FONT.displayBold, // Font 3
  },
  headerUnderline: {
    height: 3,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    marginTop: 6,
  },
  iconPill: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.surface1,
    borderColor: theme.colors.strokeSoft,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.soft,
  },

  /* toolbar */
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  addWorkoutBtn: {
    backgroundColor: theme.colors.primary600,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#0e3c24",
  },
  addWorkoutText: { color: "#052d1b", fontWeight: "900", fontSize: 16 },

  nameInput: {
    backgroundColor: theme.colors.surface1,
    color: theme.colors.textHi,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
  },
  topBtn: {
    backgroundColor: "#0b1a13",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary600,
    alignItems: "center",
    justifyContent: "center",
  },
  topBtnText: { color: theme.colors.primary600, fontWeight: "800" },

  /* sticky save */
  stickySaveWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    paddingHorizontal: theme.layout.xl,
  },
  bigSaveBtn: {
    backgroundColor: theme.colors.primary600,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0e3c24",
  },
  bigSaveText: { color: "#052d1b", fontSize: 18 },

  /* card */
  card: {
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
    padding: theme.layout.lg,
    width: "100%",
    ...theme.shadow.soft,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0E1216",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  cardName: {
    flex: 1,
    color: theme.colors.textHi,
    fontWeight: "800",
  },

  /* Set+ chip */
  setChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "#0A0F12",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  setChipText: {
    color: theme.colors.textHi,
    fontSize: 12,
    letterSpacing: 0.2,
  },

  /* sets */
  setGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 10,
    rowGap: 10,
  },
  setTile: {
    backgroundColor: "#0C1016",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
    padding: 12,
    flexBasis: "48%", // 2 per row
    minWidth: 150,
    position: "relative",
  },
  setBadge: {
    color: theme.colors.textHi,
    marginBottom: 8,
    fontSize: 14,
  },
  shotPct: {
    position: "absolute",
    right: 10,
    top: 10,
    color: theme.colors.primary600,
    fontWeight: "900",
    fontSize: 12,
  },

  /* angled inputs */
  angledWrap: {
    transform: [{ skewX: "-12deg" }],
    backgroundColor: "#0E141C",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
    marginBottom: 8,
    overflow: "hidden",
  },
  angledInput: {
    transform: [{ skewX: "12deg" }],
    color: theme.colors.textHi,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  /* Running cards */
  metric: {
    flex: 1,
    backgroundColor: "#0C1016",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  metricLabel: { color: theme.colors.textLo, marginBottom: 4, fontWeight: "700" },
  metricValue: { color: theme.colors.textHi, fontWeight: "900", fontSize: 18 },

  ctrlRow: { flexDirection: "row", gap: 10, justifyContent: "center", marginTop: 4 },
  ctrlBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 120,
    alignItems: "center",
  },
  ctrlHollow: { borderWidth: 1, borderColor: theme.colors.strokeSoft, backgroundColor: "#0B121A" },
  ctrlText: { fontWeight: "900" },
});


















