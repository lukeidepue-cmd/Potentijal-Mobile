// app/(tabs)/workouts.tsx
// Simplified, one-card-per-row workouts with universal Set+ per square
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
} from "react-native";
import { useRouter } from "expo-router";
import { useMode } from "../../providers/ModeContext";

import * as Location from "expo-location";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";

// App header (string title, {lib:'ion', name:'...'} icon)
import AppHeader from "../../components/AppHeader";
import { theme } from "../../constants/theme";

/* ---------- Types ---------- */
type ModeKey =
  | "lifting"
  | "basketball"
  | "running"
  | "football"
  | "soccer"
  | "baseball"
  | "hockey";

// unified "square" kinds per mode
type ItemKind =
  // shared
  | "exercise"
  // basketball
  | "bb_shot"
  // football
  | "fb_sprint"
  | "fb_catch"
  | "fb_throw"
  | "fb_tackle"
  // baseball
  | "bs_hit"
  | "bs_field"
  | "bs_sprint"
  // hockey
  | "hk_shoot"
  | "hk_skate"
  | "hk_stick"
  // soccer
  | "sc_dribble"
  | "sc_shoot"
  | "sc_pass"
  | "sc_sprint";

type SetRecord = Record<string, string>;

type AnyItem = {
  id: string;
  kind: ItemKind;
  name: string;
  sets: SetRecord[]; // fields vary by kind
};

type DraftTuple = readonly [
  AnyItem[],
  React.Dispatch<React.SetStateAction<AnyItem[]>>
];

/* ---------- Helpers ---------- */
const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------- Field templates per square kind ---------- */
const FIELD_SETS: Record<
  ItemKind,
  { key: string; label: string; numeric?: boolean }[]
> = {
  // Exercise: Reps + Weight (your spec)
  exercise: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "weight", label: "Weight (lb)", numeric: true },
  ],

  // Basketball shot: Attempted + Made
  bb_shot: [
    { key: "attempted", label: "Attempted", numeric: true },
    { key: "made", label: "Made", numeric: true },
  ],

  // Football
  fb_sprint: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
    { key: "avgTime", label: "Avg. Time", numeric: false },
  ],
  fb_catch: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
  ],
  fb_throw: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
  ],
  fb_tackle: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
  ],

  // Baseball
  bs_hit: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "avgDistance", label: "Avg. Distance (ft)", numeric: true },
  ],
  bs_field: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
  ],
  bs_sprint: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
    { key: "avgTime", label: "Avg. Time", numeric: false },
  ],

  // Hockey
  hk_shoot: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
  ],
  hk_skate: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
    { key: "avgTime", label: "Avg. Time", numeric: false },
  ],
  hk_stick: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "time", label: "Time", numeric: false },
  ],

  // Soccer
  sc_sprint: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
    { key: "avgTime", label: "Avg. Time", numeric: false },
  ],
  sc_dribble: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
    { key: "time", label: "Time", numeric: false },
  ],
  sc_pass: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
  ],
  sc_shoot: [
    { key: "reps", label: "Reps", numeric: true },
    { key: "distance", label: "Distance", numeric: false },
  ],
};

/* ---------- Running helpers ---------- */
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
    : `${Math.floor(secPerMile / 60)}:${String(
        Math.round(secPerMile % 60)
      ).padStart(2, "0")}/mi`;
const timeStr = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(
    ss
  ).padStart(2, "0")}`;
};

/* ----------------------------------------------------------------------------
   Screen
---------------------------------------------------------------------------- */
export default function WorkoutsScreen() {
  const router = useRouter();
  const { mode } = useMode();
  const m = (mode || "lifting").toLowerCase() as ModeKey;

  /* ---------- top meta ---------- */
  const [isCreating, setIsCreating] = useState(false);
  const [workoutName, setWorkoutName] = useState("");

  /* ---------- unified drafts per mode (now includes running to satisfy ModeKey) ---------- */
  const [liftDraft, setLiftDraft] = useState<AnyItem[]>([]);
  const [bbDraft, setBbDraft] = useState<AnyItem[]>([]);
  const [fbDraft, setFbDraft] = useState<AnyItem[]>([]);
  const [bsDraft, setBsDraft] = useState<AnyItem[]>([]);
  const [hkDraft, setHkDraft] = useState<AnyItem[]>([]);
  const [scDraft, setScDraft] = useState<AnyItem[]>([]);
  const [runDraft, setRunDraft] = useState<AnyItem[]>([]); // unused list, fixes indexing by ModeKey

  const drafts: Record<ModeKey, DraftTuple> = {
    lifting: [liftDraft, setLiftDraft],
    basketball: [bbDraft, setBbDraft],
    football: [fbDraft, setFbDraft],
    baseball: [bsDraft, setBsDraft],
    hockey: [hkDraft, setHkDraft],
    soccer: [scDraft, setScDraft],
    running: [runDraft, setRunDraft],
  };

  // Current tuple for this mode (no effect needed)
  const curTuple: DraftTuple = drafts[m];
  const list: AnyItem[] = curTuple[0];
  const setList: React.Dispatch<React.SetStateAction<AnyItem[]>> = curTuple[1];

  /* ---------- add-item helpers per mode ---------- */
  const addItem = (kind: ItemKind) => {
    const fields = FIELD_SETS[kind];
    const empty: SetRecord = {};
    fields.forEach((f) => (empty[f.key] = ""));
    setList((cur: AnyItem[]) => [
      ...cur,
      {
        id: uid(),
        kind,
        name: "",
        sets: [{ ...empty }],
      },
    ]);
  };

  const updateName = (id: string, name: string) => {
    setList((cur: AnyItem[]) =>
      cur.map((x: AnyItem) => (x.id === id ? { ...x, name } : x))
    );
  };

  const removeItem = (id: string) => {
    setList((cur: AnyItem[]) => cur.filter((x: AnyItem) => x.id !== id));
  };

  const addSet = (id: string) => {
    const item = list.find((x: AnyItem) => x.id === id);
    if (!item) return;
    const fields = FIELD_SETS[item.kind];
    const empty: SetRecord = {};
    fields.forEach((f) => (empty[f.key] = ""));
    setList((cur: AnyItem[]) =>
      cur.map((x: AnyItem) =>
        x.id === id ? { ...x, sets: [...x.sets, { ...empty }] } : x
      )
    );
  };

  const updateSet = (id: string, index: number, key: string, value: string) => {
    setList((cur: AnyItem[]) =>
      cur.map((x: AnyItem) =>
        x.id !== id
          ? x
          : {
              ...x,
              sets: x.sets.map((s: SetRecord, i: number) =>
                i === index ? { ...s, [key]: value } : s
              ),
            }
      )
    );
  };

  /* ---------- Save ---------- */
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

  /* ----------------------------------------------------------------------------
     RUNNING
  ---------------------------------------------------------------------------- */
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
        setPoints((prev: Pt[]) => [
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
        setPoints((prev: Pt[]) => [
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

  /* ---------- Header icon as a literal union to satisfy AppHeader ---------- */
  const headerIconForMode = useMemo(() => {
    switch (m) {
      case "lifting":
        return { lib: "ion", name: "barbell-outline" as const };
      case "basketball":
        return { lib: "ion", name: "basketball-outline" as const };
      case "running":
        return { lib: "ion", name: "walk-outline" as const };
      case "football":
        return { lib: "ion", name: "american-football-outline" as const };
      case "soccer":
        return { lib: "ion", name: "football-outline" as const };
      case "baseball":
        return { lib: "ion", name: "baseball-outline" as const };
      case "hockey":
        // Placeholder; Ionicons lacks hockey puck
        return { lib: "ion", name: "ice-cream-outline" as const };
      default:
        return { lib: "ion", name: "barbell-outline" as const };
    }
  }, [m]);

  /* ----------------------------------------------------------------------------
     RENDER
  ---------------------------------------------------------------------------- */
  // Toolbar layout per mode (rows, with fractional widths)
  const Toolbar = () => {
    if (m === "running") {
      return (
        <>
          <Pressable onPress={startRun} style={styles.addWorkoutBtn}>
            <Text style={styles.addWorkoutText}>+ Start Run</Text>
          </Pressable>
        </>
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
          <Text style={styles.addWorkoutText}>+ Add Workout</Text>
        </Pressable>
      );
    }

    const Button = ({
      label,
      onPress,
      flex = 1,
    }: {
      label: string;
      onPress: () => void;
      flex?: number;
    }) => (
      <Pressable onPress={onPress} style={[styles.topBtn, { flex }]}>
        <Text style={styles.topBtnText} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );

    // per-mode configs
    const row1: React.ReactNode[] = [];
    const row2: React.ReactNode[] = [];

    const nameBox = (
      <TextInput
        key="name"
        value={workoutName}
        onChangeText={setWorkoutName}
        placeholder="Workout name…"
        placeholderTextColor={theme.colors.textLo}
        style={styles.nameInput}
      />
    );

    if (m === "lifting") {
      row1.push(
        <View key="nameWrap" style={{ flex: 1 }}>
          {nameBox}
        </View>
      );
      row1.push(
        <Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} flex={1} />
      );
    } else if (m === "basketball") {
      row1.push(
        <View key="nameWrap" style={{ flex: 1 }}>
          {nameBox}
        </View>
      );
      row1.push(
        <Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} flex={1} />
      );
      row1.push(
        <Button key="+shot" label="+ Shot" onPress={() => addItem("bb_shot")} flex={1} />
      );
    } else if (m === "football") {
      row1.push(
        <View key="nameWrap" style={{ flex: 1 }}>
          {nameBox}
        </View>
      );
      row1.push(
        <Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} flex={1} />
      );
      row1.push(
        <Button key="+spr" label="+ Sprints" onPress={() => addItem("fb_sprint")} flex={1} />
      );
      row2.push(
        <Button key="+catch" label="+ Catching" onPress={() => addItem("fb_catch")} />
      );
      row2.push(
        <Button key="+throw" label="+ Throwing" onPress={() => addItem("fb_throw")} />
      );
      row2.push(
        <Button key="+tackle" label="+ Tackling" onPress={() => addItem("fb_tackle")} />
      );
    } else if (m === "baseball") {
      row1.push(
        <View key="nameWrap" style={{ flex: 1 }}>
          {nameBox}
        </View>
      );
      row1.push(
        <Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} flex={1} />
      );
      row2.push(
        <Button key="+hit" label="+ Hitting" onPress={() => addItem("bs_hit")} />
      );
      row2.push(
        <Button key="+field" label="+ Fielding" onPress={() => addItem("bs_field")} />
      );
      row2.push(
        <Button key="+spr" label="+ Sprints" onPress={() => addItem("bs_sprint")} />
      );
    } else if (m === "soccer") {
      row1.push(
        <View key="nameWrap" style={{ flex: 1 }}>
          {nameBox}
        </View>
      );
      row1.push(
        <Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} flex={1} />
      );
      row1.push(
        <Button key="+drib" label="+ Dribbling" onPress={() => addItem("sc_dribble")} flex={1} />
      );
      row2.push(
        <Button key="+shoot" label="+ Shooting" onPress={() => addItem("sc_shoot")} />
      );
      row2.push(
        <Button key="+pass" label="+ Passing" onPress={() => addItem("sc_pass")} />
      );
      row2.push(
        <Button key="+spr" label="+ Sprints" onPress={() => addItem("sc_sprint")} />
      );
    } else if (m === "hockey") {
      row1.push(
        <View key="nameWrap" style={{ flex: 1 }}>
          {nameBox}
        </View>
      );
      row1.push(
        <Button key="+ex" label="+ Exercise" onPress={() => addItem("exercise")} flex={1} />
      );
      row2.push(
        <Button key="+shoot" label="+ Shooting" onPress={() => addItem("hk_shoot")} flex={0.6} />
      );
      row2.push(
        <Button key="+skate" label="+ Skating" onPress={() => addItem("hk_skate")} flex={0.6} />
      );
      row2.push(
        <Button key="+stick" label="+ Stickhandling" onPress={() => addItem("hk_stick")} flex={0.8} />
      );
    }

    return (
      <>
        <View style={styles.row}>{row1}</View>
        {row2.length > 0 && <View style={[styles.row, { marginTop: 8 }]}>{row2}</View>}
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1, backgroundColor: theme.colors.bg0 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: theme.layout.xl, paddingTop: theme.layout.lg, marginTop: 30 }}>
      <AppHeader title="Workouts" icon={({lifting:{lib:"ion",name:"barbell-outline"},basketball:{lib:"ion",name:"basketball-outline"},running:{lib:"ion",name:"walk-outline"},football:{lib:"ion",name:"american-football-outline"},soccer:{lib:"ion",name:"football-outline"},baseball:{lib:"ion",name:"baseball-outline"},hockey:{lib:"ion",name:"time"}} as const)[m]} />
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
          list.map((item: AnyItem) => (
            <FullWidthCard
              key={item.id}
              item={item}
              onRemove={() => removeItem(item.id)}
              onName={(v) => updateName(item.id, v)}
              onAddSet={() => addSet(item.id)}
              onChange={(setIdx, key, v) => updateSet(item.id, setIdx, key, v)}
            />
          ))}

        {/* Running */}
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
            <Text style={styles.bigSaveText}>Save Workout</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

/* ---------- Full width "square" (card) with wrap sets ---------- */
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

  // basketball shot % per-set (show to the right of the set)
  const pctFor = (s: SetRecord) => {
    const a = parseInt(s.attempted || "0", 10) || 0;
    const made = parseInt(s.made || "0", 10) || 0;
    return a > 0 ? Math.round((made / a) * 100) : null;
  };

  return (
    <View style={styles.card}>
      {/* header: name + remove */}
      <View style={styles.cardHeader}>
        <TextInput
          value={item.name}
          onChangeText={onName}
          placeholder={item.kind === "exercise" ? "Exercise name…" : "Drill name…"}
          placeholderTextColor={theme.colors.textLo}
          style={styles.cardName}
        />
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={{ color: theme.colors.textLo, fontWeight: "800" }}>×</Text>
        </Pressable>
      </View>

      {/* sets grid (target 4–5 per row; wraps automatically) */}
      <View style={styles.setGrid}>
        {item.sets.map((s: SetRecord, idx: number) => (
          <View key={idx} style={styles.setTile}>
            <Text style={styles.setBadge}>Set {idx + 1}</Text>

            {fields.map((f) => (
              <TextInput
                key={f.key}
                value={s[f.key] ?? ""}
                onChangeText={(t) =>
                  onChange(idx, f.key, f.numeric ? t.replace(/[^\d.]/g, "") : t)
                }
                placeholder={f.label}
                placeholderTextColor={theme.colors.textLo}
                keyboardType={f.numeric ? "numeric" : "default"}
                style={styles.inputMini}
              />
            ))}

            {/* basketball shot % to the right (inside tile) */}
            {item.kind === "bb_shot" && (
              <Text style={styles.shotPct}>
                {(() => {
                  const pct = pctFor(s);
                  return pct == null ? "—" : `${pct}%`;
                })()}
              </Text>
            )}
          </View>
        ))}

        <Pressable onPress={onAddSet} style={styles.setPlusBtn}>
          <Text style={styles.setPlusText}>Set +</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ---------- Running section (taller map) ---------- */
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
                coordinates={points.map((p: Pt) => ({
                  latitude: p.lat,
                  longitude: p.lon,
                }))}
                strokeColor={theme.colors.primary600}
                strokeWidth={4}
              />
            )}
            {points.length > 0 && (
              <Marker
                coordinate={{
                  latitude: points[points.length - 1].lat,
                  longitude: points[points.length - 1].lon,
                }}
              />
            )}
          </MapView>
        </View>
      </View>

      {runState !== "idle" && (
        <View style={[styles.card, { padding: 12, gap: 10 }]}>
          <Text style={{ color: theme.colors.textLo, textAlign: "center" }}>
            {runState === "tracking"
              ? "Running"
              : runState === "paused"
              ? "Paused"
              : "Finished"}
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
              <Pressable
                onPress={pauseRun}
                style={[styles.ctrlBtn, styles.ctrlHollow]}
              >
                <Text style={[styles.ctrlText, { color: theme.colors.textHi }]}>Pause</Text>
              </Pressable>
              <Pressable
                onPress={endRun}
                style={[styles.ctrlBtn, { backgroundColor: theme.colors.danger }]}
              >
                <Text style={[styles.ctrlText, { color: "#fff" }]}>End Run</Text>
              </Pressable>
            </View>
          )}
          {runState === "paused" && (
            <View style={styles.ctrlRow}>
              <Pressable
                onPress={resumeRun}
                style={[styles.ctrlBtn, { backgroundColor: theme.colors.primary600 }]}
              >
                <Text style={[styles.ctrlText, { color: "#052d1b" }]}>
                  Resume
                </Text>
              </Pressable>
              <Pressable
                onPress={endRun}
                style={[styles.ctrlBtn, { backgroundColor: theme.colors.danger }]}
              >
                <Text style={[styles.ctrlText, { color: "#fff" }]}>End Run</Text>
              </Pressable>
            </View>
          )}
          {runState === "finished" && (
            <View style={styles.ctrlRow}>
              <Pressable
                onPress={saveRun}
                style={[styles.ctrlBtn, { backgroundColor: theme.colors.primary600 }]}
              >
                <Text style={[styles.ctrlText, { color: "#052d1b" }]}>
                  Save Run
                </Text>
              </Pressable>
              <Pressable
                onPress={resumeRun}
                style={[styles.ctrlBtn, { backgroundColor: theme.colors.danger }]}
              >
                <Text style={[styles.ctrlText, { color: "#fff" }]}>
                  Resume Run
                </Text>
              </Pressable>
            </View>
          )}

          <Text
            style={{
              color: theme.colors.textHi,
              textAlign: "center",
              fontSize: 24,
              fontWeight: "900",
              marginTop: 4,
            }}
          >
            Time: {timeStr(elapsed)}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ----------------------------------------------------------------------------
   Styles
---------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },

  addWorkoutBtn: {
    backgroundColor: theme.colors.primary600,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
  },
  addWorkoutText: { color: "#052d1b", fontWeight: "900", fontSize: 16 },

  nameInput: {
    backgroundColor: theme.colors.surface1,
    color: theme.colors.textHi,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
  },
  topBtn: {
    backgroundColor: "#0b1a13",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary600,
    alignItems: "center",
    justifyContent: "center",
  },
  topBtnText: { color: theme.colors.primary600, fontWeight: "800" },

  stickySaveWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    paddingHorizontal: theme.layout.xl,
  },
  bigSaveBtn: {
    backgroundColor: theme.colors.primary600,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0e3c24",
  },
  bigSaveText: { color: "#052d1b", fontWeight: "900", fontSize: 18 },

  /* Card */
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
    marginBottom: 8,
  },
  cardName: {
    flex: 1,
    backgroundColor: theme.colors.surface2,
    color: theme.colors.textHi,
    paddingHorizontal: theme.layout.lg,
    paddingVertical: theme.layout.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
    ...theme.text.title,
  },

  setGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "flex-start",
  },
  setTile: {
    backgroundColor: "#0C1016",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
    padding: 10,
    flexBasis: "23%",
    minWidth: 120,
    position: "relative",
  },
  setBadge: { color: theme.colors.textLo, fontSize: 11, fontWeight: "800", marginBottom: 6 },
  inputMini: {
    backgroundColor: "#0E141C",
    color: theme.colors.textHi,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
    marginBottom: 6,
  },
  shotPct: {
    position: "absolute",
    right: 8,
    top: 8,
    color: theme.colors.primary600,
    fontWeight: "900",
    fontSize: 12,
  },
  setPlusBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.strokeSoft,
    backgroundColor: "#0B121A",
  },
  setPlusText: { color: theme.colors.textHi, fontWeight: "800" },

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

















