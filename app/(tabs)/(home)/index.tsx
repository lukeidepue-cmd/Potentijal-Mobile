// app/(tabs)/(home)/index.tsx
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useMode } from "../../../providers/ModeContext";
import ProgressRing from "../../../components/ProgressRing";
import { useMeals, MEAL_TYPES } from "../../../providers/MealsContext";

/* ======== Shared system imports ======== */
import { theme } from "../../../constants/theme";
import AppHeader from "../../../components/AppHeader";
import Card from "../../../components/Card";
import PrimaryButton from "../../../components/Button";
import ProgressBar from "../../../components/ProgressBar";

/* Macros (for lifting home) */
type MacroKey = "calories" | "protein" | "carbs" | "fat";

/** Use theme macro colors */
const MACRO_COLORS: Record<MacroKey, string> = {
  calories: theme.colors.primary600,
  protein:  theme.colors.danger,
  carbs:    theme.colors.secondary500,
  fat:      theme.colors.warning,
} as const;

const GOALS = { calories: 2300, protein: 160, carbs: 250, fat: 70 };

export default function HomeIndex() {
  const { mode, setMode } = useMode();
  const [showChooser, setShowChooser] = useState(false);

  // orange-ish calendar when in Basketball mode
  const calendarColor = mode === "basketball" ? theme.colors.warning : theme.colors.textHi;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg0 }}>
      <AppHeader
        title="Home"
        // Use a union-safe icon name
        icon={{ lib: "ion", name: "time", color: calendarColor }}
        right={
          <View style={{ flexDirection: "row", gap: theme.layout.lg }}>
            <Pressable
              onPress={() => setShowChooser(true)}
              style={({ pressed }) => ({
                width: 48, height: 48, borderRadius: theme.radii.pill,
                backgroundColor: pressed ? theme.colors.surface2 : theme.colors.surface1,
                borderWidth: 1, borderColor: theme.colors.strokeSoft,
                alignItems: "center", justifyContent: "center",
                ...theme.shadow.soft,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <MaterialCommunityIcons name="dumbbell" size={24} color={theme.colors.textHi} />
            </Pressable>
            <Pressable
              onPress={() => {}}
              style={({ pressed }) => ({
                width: 48, height: 48, borderRadius: theme.radii.lg,
                backgroundColor: pressed ? theme.colors.surface2 : theme.colors.surface1,
                borderWidth: 1, borderColor: theme.colors.strokeSoft,
                alignItems: "center", justifyContent: "center",
                ...theme.shadow.soft,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Ionicons name="settings-outline" size={22} color={theme.colors.textHi} />
            </Pressable>
          </View>
        }
      />

      {/* Mode-specific body */}
      {mode === "lifting" ? (
        <LiftingHome />
      ) : mode === "basketball" ? (
        <BasketballHome />
      ) : mode === "football" ? (
        <FootballHome />
      ) : mode === "running" ? (
        <RunningHome />
      ) : mode === "baseball" ? (
        <BaseballHome />
      ) : mode === "soccer" ? (
        <SoccerHome />
      ) : (
        <HockeyHome />
      )}

      {/* Mode chooser */}
      <Modal
        visible={showChooser}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChooser(false)}
      >
        <Pressable
          onPress={() => setShowChooser(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }}
        />
        <View
          style={{
            position: "absolute",
            right: 12,
            top: 92,
            backgroundColor: "#0f1317",
            borderRadius: 16,
            paddingVertical: 8,
            paddingHorizontal: 8,
            borderWidth: 1,
            borderColor: "#1a222b",
            minWidth: 220,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.textLo,
              marginBottom: 6,
              marginLeft: 6,
              fontWeight: "700",
            }}
          >
            Switch mode
          </Text>

          <ModeItem icon={<MaterialCommunityIcons name="dumbbell" size={18} color={theme.colors.textHi} />} label="Lifting" onPress={() => { setMode("lifting"); setShowChooser(false); }} />
          <ModeItem icon={<Ionicons name="basketball-outline" size={18} color={theme.colors.textHi} />} label="Basketball" onPress={() => { setMode("basketball"); setShowChooser(false); }} />
          <ModeItem icon={<Ionicons name="american-football-outline" size={18} color={theme.colors.textHi} />} label="Football" onPress={() => { setMode("football"); setShowChooser(false); }} />
          <ModeItem icon={<MaterialCommunityIcons name="run" size={18} color={theme.colors.textHi} />} label="Running" onPress={() => { setMode("running"); setShowChooser(false); }} />
          <ModeItem icon={<MaterialCommunityIcons name="baseball" size={18} color={theme.colors.textHi} />} label="Baseball" onPress={() => { setMode("baseball"); setShowChooser(false); }} />
          <ModeItem icon={<Ionicons name="football-outline" size={18} color={theme.colors.textHi} />} label="Soccer" onPress={() => { setMode("soccer"); setShowChooser(false); }} />
          <ModeItem icon={<MaterialCommunityIcons name="hockey-sticks" size={18} color={theme.colors.textHi} />} label="Hockey" onPress={() => { setMode("hockey"); setShowChooser(false); }} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ======================= LIFTING HOME ======================= */
function LiftingHome() {
  const [macro, setMacro] = useState<MacroKey>("calories");
  const { meals, entryTotals } = useMeals();

  const todayTotals = useMemo(() => {
    let sum = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    (MEAL_TYPES as Array<keyof typeof meals>).forEach((m) => {
      meals[m].forEach((f) => {
        const t = entryTotals(f);
        sum.calories += t.calories;
        sum.protein += t.protein;
        sum.carbs += t.carbs;
        sum.fat += t.fat;
      });
    });
    return sum;
  }, [meals, entryTotals]);

  const consumed = todayTotals[macro];
  const goal = GOALS[macro];
  const progress = goal > 0 ? Math.min(1, consumed / goal) : 0;
  const left = Math.max(0, Math.round(goal - consumed));
  const centerText = macro === "calories" ? `${left} left` : `${left}g left`;

  const days = getCurrentWeekStartingSunday();
  const workoutsByISO: Record<string, string | undefined> = {};

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.xl,
          paddingBottom: 120,
          paddingTop: theme.layout.lg,
          gap: theme.layout.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <Card>
          <Text
            style={{
              ...theme.text.h1,
              color: theme.colors.textHi,
              textAlign: "center",
              marginBottom: theme.layout.lg,
            }}
          >
            Workouts This Week
          </Text>
          <View style={{ flexDirection: "row", gap: theme.layout.lg }}>
            {days.slice(0, 4).map((d, i) => (
              <DayTile key={i} date={d} workoutName={workoutsByISO[toISO(d)]} />
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: theme.layout.lg, marginTop: theme.layout.lg }}>
            {days.slice(4, 7).map((d, i) => (
              <DayTile key={i} date={d} workoutName={workoutsByISO[toISO(d)]} />
            ))}
            <StreakTile />
          </View>
        </Card>

        {/* Today’s Nutrition */}
        <Card>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: "#111",
              marginBottom: 10,
            }}
          >
            Today’s Nutrition
          </Text>

          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            {/* Vertical bar */}
            <View
              style={{
                width: 72,
                height: 240,
                borderRadius: 14,
                backgroundColor: "#F3F4F6",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {/* % label inside */}
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  right: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 12, fontWeight: "900", color: "#6b7280" }}
                >
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <View
                style={{
                  width: "100%",
                  height: Math.max(4, 240 * progress),
                  backgroundColor: MACRO_COLORS[macro],
                }}
              />
            </View>

            {/* Macro list */}
            <View style={{ flex: 1, gap: 12 }}>
              {(["calories", "protein", "carbs", "fat"] as MacroKey[]).map(
                (k) => {
                  const c = todayTotals[k];
                  const g = GOALS[k];
                  const active = macro === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setMacro(k)}
                      style={{
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderWidth: 2,
                        borderColor: active ? MACRO_COLORS[k] : "#E5E7EB",
                        backgroundColor: active ? "#F8FAFC" : "#FFFFFF",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          backgroundColor: MACRO_COLORS[k],
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "900",
                          color: "#111",
                          flex: 1,
                          textTransform: "capitalize",
                        }}
                      >
                        {k}
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
                        {Math.round(c)}
                        {k === "calories" ? "" : "g"} / {g}
                        {k === "calories" ? "" : "g"}
                      </Text>
                    </Pressable>
                  );
                }
              )}

              {/* Actions */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                <PrimaryButton
                  label="+ Add meal"
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push("/(tabs)/meals/search");
                  }}
                />
                <PrimaryButton
                  label="+ Add workout"
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push("/(tabs)/workouts");
                  }}
                />
              </View>
            </View>
          </View>

          <Text
            style={{
              marginTop: 10,
              color: "#667085",
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {centerText}
          </Text>
        </Card>

        <Card>
          <CardTitle>Weekly Progress</CardTitle>
          <Muted>
            Your top improvements (e.g., Bench 40×8 → 40×12) will appear here
            after two weeks.
          </Muted>
        </Card>
      </ScrollView>
    </>
  );
}

/* ======================= BASKETBALL HOME ======================= */
function BasketballHome() {
  const days = getCurrentWeekStartingSunday();
  const practicesByISO: Record<string, string | undefined> = {};

  const weeklyGoals = [
    { label: "200 3PT", pct: 0.5 },
    { label: "4 Workouts", pct: 0.75 },
    { label: "200 2PT", pct: 0.3 },
  ];

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.xl,
          paddingBottom: 120,
          paddingTop: theme.layout.lg,
          gap: theme.layout.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* WEEKLY GOALS */}
        <Card>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: "#111",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Weekly Goals
          </Text>

          <View style={{ gap: 14 }}>
            {weeklyGoals.map((g, idx) => (
              <WeeklyGoalRow key={idx} label={g.label} pct={g.pct} />
            ))}
          </View>

          <View style={{ alignItems: "flex-end", marginTop: 12 }}>
            <PrimaryButton
              label="+ Add Weekly Goal"
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/(tabs)/(home)/basketball/weekly-goals");
              }}
            />
          </View>
        </Card>

        {/* WEEKLY SKILLS */}
        <Card>
          <CardTitle>Weekly Skills Progress</CardTitle>
          <Muted>
            Improvements (e.g., FT 78% → 85%, 3PT volume up) will appear after
            two weeks.
          </Muted>
        </Card>

        {/* TEAM PRACTICES */}
        <Card>
          <Text
            style={{ fontSize: 16, fontWeight: "900", color: "#111", marginBottom: 8 }}
          >
            Team practices this week
          </Text>
          <View
            style={{
              height: 96,
              borderRadius: 14,
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#e8edf3",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#111" }}>
              0
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", marginTop: 10 }}>
            <PrimaryButton
              label="+ Add Practice"
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/(tabs)/(home)/basketball/add-practice");
              }}
            />
          </View>
        </Card>

        {/* GAMES */}
        <Card>
          <Text
            style={{ fontSize: 16, fontWeight: "900", color: "#111", marginBottom: 8 }}
          >
            Games this week
          </Text>
          <View
            style={{
              height: 96,
              borderRadius: 14,
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#e8edf3",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#111" }}>
              0
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", marginTop: 10 }}>
            <PrimaryButton
              label="+ Add Game"
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/(tabs)/(home)/basketball/add-game");
              }}
            />
          </View>
        </Card>

        {/* Calendar tiles */}
        <Card>
          <Text
            style={{
              ...theme.text.h1,
              color: theme.colors.textHi,
              textAlign: "center",
              marginBottom: theme.layout.lg,
            }}
          >
            Practices This Week
          </Text>
          <View style={{ flexDirection: "row", gap: theme.layout.lg }}>
            {days.slice(0, 4).map((d, i) => (
              <DayTile key={i} date={d} workoutName={practicesByISO[toISO(d)]} />
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: theme.layout.lg, marginTop: theme.layout.lg }}>
            {days.slice(4, 7).map((d, i) => (
              <DayTile key={i} date={d} workoutName={practicesByISO[toISO(d)]} />
            ))}
            <StreakTile />
          </View>
        </Card>
      </ScrollView>
    </>
  );
}

/* Weekly goal row using shared ProgressBar */
function WeeklyGoalRow({ label, pct }: { label: string; pct: number }) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ color: "#111", fontWeight: "800", flex: 1 }} numberOfLines={1}>
          {label}
        </Text>
        <Text style={{ color: "#111", fontWeight: "900" }}>{Math.round(clamped * 100)}%</Text>
      </View>
      <ProgressBar value={clamped} />
    </View>
  );
}

/* ======================= FOOTBALL HOME ======================= */
function FootballHome() {
  type DrillKey = "sprint" | "agility" | "power";
  const [drill, setDrill] = useState<DrillKey>("sprint");
  const [totals, setTotals] = useState({ sprint: 0, agility: 0, power: 0 });
  const [goals, setGoals] = useState({ sprint: 1000, agility: 200, power: 150 });

  const DRILL_LABELS: Record<DrillKey, string> = {
    sprint: "Sprint Distance",
    agility: "Agility Drills",
    power: "Power/Plyo",
  };
  const DRILL_COLORS: Record<DrillKey, string> = {
    sprint: "#0ea5e9",
    agility: "#f59e0b",
    power: "#17D67F",
  };
  const DRILL_UNIT: Record<DrillKey, string> = {
    sprint: "m",
    agility: "sets",
    power: "reps",
  };

  const progress = Math.min(1, totals[drill] / goals[drill]);
  const centerText = `${totals[drill]}/${goals[drill]} ${DRILL_UNIT[drill]}`;
  const cycleDrill = () => {
    const order: DrillKey[] = ["sprint", "agility", "power"];
    setDrill(order[(order.indexOf(drill) + 1) % order.length]);
  };

  const days = getCurrentWeekStartingSunday();
  const sessionsByISO: Record<string, string | undefined> = {};
  const [showLog, setShowLog] = useState(false);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.xl,
          paddingBottom: 120,
          paddingTop: theme.layout.lg,
          gap: theme.layout.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#111", textAlign: "center", marginBottom: 10 }}>
            Training This Week
          </Text>
          <View style={{ flexDirection: "row", gap: theme.layout.lg }}>
            {days.slice(0, 4).map((d, i) => (
              <DayTile key={i} date={d} workoutName={sessionsByISO[toISO(d)]} />
            ))}
          </View>
        </Card>

        <Card>
          <CardTitle>Weekly Performance Progress</CardTitle>
          <Muted>Speed splits, agility scores, and power PRs will appear after two weeks.</Muted>
        </Card>

        <Card>
          <CardTitle>Hours Trained This Week</CardTitle>
          <Muted>Total minutes/hours across your logged football sessions will show here.</Muted>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Pressable onPress={cycleDrill} hitSlop={8}>
                <Text style={{ fontSize: 18, fontWeight: "900", color: DRILL_COLORS[drill], textDecorationLine: "underline", marginBottom: 3 }}>
                  {DRILL_LABELS[drill]}
                </Text>
              </Pressable>
              <ProgressRing size={170} strokeWidth={14} progress={progress} centerText={centerText} />
              <Text style={{ marginTop: 8, color: "#666" }}>{drill === "sprint" ? "Distance today" : "Volume today"}</Text>
            </View>
            <View style={{ flex: 1, gap: 10 }}>
              <MiniStat color="#0ea5e9" label="Top Speed" value="—" />
              <MiniStat color="#f59e0b" label="Agility Score" value="—" />
              <MiniStat color="#17D67F" label="Minutes Trained" value="—" />
            </View>
          </View>
        </Card>
      </ScrollView>

      <Fab
        label="Log session"
        onPress={() => {
          Haptics.selectionAsync();
          setShowLog(true);
        }}
      />

      <Modal
        visible={showLog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLog(false)}
      >
        <CenterModal>
          <Text style={{ fontSize: 18, fontWeight: "900", marginBottom: 12 }}>
            Log {DRILL_LABELS[drill]}
          </Text>
          <PrimaryButton
            onPress={() => {
              const bump = drill === "sprint" ? 200 : drill === "agility" ? 10 : 15;
              setTotals({ ...totals, [drill]: totals[drill] + bump });
              setShowLog(false);
            }}
            label={`+${drill === "sprint" ? 200 : drill === "agility" ? 10 : 15} ${DRILL_UNIT[drill]}`}
          />
          <Cancel onPress={() => setShowLog(false)} />
        </CenterModal>
      </Modal>
    </>
  );
}

/* ----------------------- RUNNING HOME ----------------------- */
function RunningHome() {
  const weekly = { milesGoal: 10, milesDone: 2, paceGoal: "7:50" };
  const progressMiles =
    weekly.milesGoal > 0 ? Math.min(1, weekly.milesDone / weekly.milesGoal) : 0;

  const runs: Array<{ dateISO: string; miles: number; minutes: number; where: string }> = [
    { dateISO: new Date().toISOString(), miles: 4.8, minutes: 70, where: "Central Park" },
    { dateISO: new Date(Date.now() - 86400000).toISOString(), miles: 2.2, minutes: 40, where: "Times Square" },
  ];

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          paddingTop: 26,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Goals */}
        <Card>
          <Text
            style={{
              ...theme.text.h1,
              color: theme.colors.textHi,
              textAlign: "center",
              marginBottom: theme.layout.lg,
            }}
          >
            Weekly Goals
          </Text>

          {/* Miles goal row */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 10 }}>
              <Text style={{ color: "#111", fontWeight: "900", flex: 1 }}>{weekly.milesGoal} miles</Text>
              <Text style={{ color: "#111", fontWeight: "900" }}>{Math.round(progressMiles * 100)}%</Text>
            </View>
            <ProgressBar value={progressMiles} />
          </View>

          {/* Pace goal row – display only for now */}
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 10 }}>
              <Text style={{ color: "#111", fontWeight: "900", flex: 1 }}>{`Better than ${weekly.paceGoal} pace`}</Text>
              <Text style={{ color: "#111", fontWeight: "900" }}>{weekly.paceGoal}</Text>
            </View>
            <ProgressBar value={0} />
          </View>

          <View style={{ alignItems: "flex-end", marginTop: 12 }}>
            <PrimaryButton
              label="+ Add Weekly Goal"
              onPress={() => router.push("/(tabs)/(home)/running/weekly-goals")}
            />
          </View>
        </Card>

        {/* Weekly Progress */}
        <Card>
          <CardTitle>Weekly Progress</CardTitle>
          <Muted>PRs and improvements (e.g., fastest 5K, best weekly distance) will appear here.</Muted>
        </Card>

        {/* Runs this week */}
        <Card>
          <CardTitle>Runs this week</CardTitle>
          <View style={{ gap: 10 }}>
            {runs.map((r, i) => (
              <View
                key={i}
                style={{
                  borderWidth: 1, borderColor: "#e8e8e8",
                  backgroundColor: "#fff", borderRadius: 12,
                  padding: 12, flexDirection: "row", alignItems: "center", gap: 10,
                }}
              >
                {/* Date pill */}
                <View style={{ minWidth: 60, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "#0b0b0c" }}>
                  <Text style={{ color: "#fff", fontWeight: "900", textAlign: "center" }}>{fmtDate(r.dateISO)}</Text>
                </View>

                {/* Description */}
                <Text style={{ color: "#111", fontWeight: "700", flexShrink: 1 }} numberOfLines={2}>
                  {`${r.miles.toFixed(1)} miles in ${Math.floor(r.minutes / 60)} hr ${r.minutes % 60} min at ${r.where}`}
                </Text>
              </View>
            ))}
            {runs.length === 0 && <Text style={{ color: "#666", fontWeight: "700" }}>No runs logged this week yet.</Text>}
          </View>
        </Card>
      </ScrollView>

      <Fab
        label="Log run"
        onPress={() => {
          Haptics.selectionAsync();
        }}
      />
    </>
  );
}

/* ======================= BASEBALL HOME ======================= */
function BaseballHome() {
  type DrillKey = "hitting" | "pitching" | "fielding";
  const [drill, setDrill] = useState<DrillKey>("hitting");
  const [totals, setTotals] = useState({ hitting: 0, pitching: 0, fielding: 0 });
  const [goals, setGoals] = useState({ hitting: 150, pitching: 80, fielding: 120 });

  const DRILL_LABELS: Record<DrillKey, string> = {
    hitting: "Hitting Reps",
    pitching: "Pitching Throws",
    fielding: "Fielding Reps",
  };
  const DRILL_COLORS: Record<DrillKey, string> = {
    hitting: "#FF5A5A",
    pitching: "#58C6FF",
    fielding: "#17D67F",
  };
  const DRILL_UNIT: Record<DrillKey, string> = {
    hitting: "swings",
    pitching: "throws",
    fielding: "reps",
  };

  const progress = Math.min(1, totals[drill] / goals[drill]);
  const centerText = `${totals[drill]}/${goals[drill]} ${DRILL_UNIT[drill]}`;
  const cycleDrill = () => {
    const order: DrillKey[] = ["hitting", "pitching", "fielding"];
    setDrill(order[(order.indexOf(drill) + 1) % order.length]);
  };

  const days = getCurrentWeekStartingSunday();
  const sessionsByISO: Record<string, string | undefined> = {};
  const [showLog, setShowLog] = useState(false);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.xl,
          paddingBottom: 120,
          paddingTop: theme.layout.lg,
          gap: theme.layout.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#111", textAlign: "center", marginBottom: 10 }}>
            Training This Week
          </Text>
          <View style={{ flexDirection: "row", gap: theme.layout.lg }}>
            {days.slice(0, 4).map((d, i) => (
              <DayTile key={i} date={d} workoutName={sessionsByISO[toISO(d)]} />
            ))}
          </View>
        </Card>

        <Card>
          <CardTitle>Weekly Skills Progress</CardTitle>
          <Muted>Your biggest gains (exit velo PRs, pitch count capacity, clean fielding streaks) will show here.</Muted>
        </Card>

        <Card>
          <CardTitle>Hours Practiced This Week</CardTitle>
          <Muted>Total minutes/hours from your logged baseball sessions will appear here.</Muted>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Pressable onPress={cycleDrill} hitSlop={8}>
                <Text style={{ fontSize: 18, fontWeight: "900", color: DRILL_COLORS[drill], textDecorationLine: "underline", marginBottom: 3 }}>
                  {DRILL_LABELS[drill]}
                </Text>
              </Pressable>
              <ProgressRing size={170} strokeWidth={14} progress={progress} centerText={centerText} />


              <Text style={{ marginTop: 8, color: "#666" }}>{drill === "pitching" ? "Throws today" : "Volume today"}</Text>
            </View>
            <View style={{ flex: 1, gap: 10 }}>
              <MiniStat color="#FF5A5A" label="Exit Velo (best)" value="—" />
              <MiniStat color="#58C6FF" label="Pitch Count" value="—" />
              <MiniStat color="#17D67F" label="Minutes Practiced" value="—" />
            </View>
          </View>
        </Card>
      </ScrollView>

      <Fab
        label="Log session"
        onPress={() => {
          Haptics.selectionAsync();
          setShowLog(true);
        }}
      />

      <Modal
        visible={showLog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLog(false)}
      >
        <CenterModal>
          <Text style={{ fontSize: 18, fontWeight: "900", marginBottom: 12 }}>
            Log {DRILL_LABELS[drill]}
          </Text>
          <PrimaryButton
            onPress={() => {
              const bump = drill === "hitting" ? 25 : drill === "pitching" ? 20 : 30;
              setTotals({ ...totals, [drill]: totals[drill] + bump });
              setShowLog(false);
            }}
            label={`+${drill === "hitting" ? 25 : drill === "pitching" ? 20 : 30} ${DRILL_UNIT[drill]}`}
          />
          <Cancel onPress={() => setShowLog(false)} />
        </CenterModal>
      </Modal>
    </>
  );
}

/* ======================= SOCCER HOME ======================= */
function SoccerHome() {
  type DrillKey = "passing" | "dribbling" | "shooting";
  const [drill, setDrill] = useState<DrillKey>("passing");
  const [totals, setTotals] = useState({ passing: 0, dribbling: 0, shooting: 0 });
  const [goals, setGoals] = useState({ passing: 200, dribbling: 150, shooting: 100 });

  const DRILL_LABELS: Record<DrillKey, string> = {
    passing: "Passing Reps",
    dribbling: "Dribbling Reps",
    shooting: "Shots",
  };
  const DRILL_COLORS: Record<DrillKey, string> = {
    passing: "#58C6FF",
    dribbling: "#17D67F",
    shooting: "#FF5A5A",
  };

  const progress = Math.min(1, totals[drill] / goals[drill]);
  const centerText = `${totals[drill]}/${goals[drill]}`;
  const cycleDrill = () => {
    const order: DrillKey[] = ["passing", "dribbling", "shooting"];
    setDrill(order[(order.indexOf(drill) + 1) % order.length]);
  };

  const days = getCurrentWeekStartingSunday();
  const sessionsByISO: Record<string, string | undefined> = {};
  const [showLog, setShowLog] = useState(false);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.xl,
          paddingBottom: 120,
          paddingTop: theme.layout.lg,
          gap: theme.layout.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#111", textAlign: "center", marginBottom: 10 }}>
            Training This Week
          </Text>
          <View style={{ flexDirection: "row", gap: theme.layout.lg }}>
            {days.slice(0, 4).map((d, i) => (
              <DayTile key={i} date={d} workoutName={sessionsByISO[toISO(d)]} />
            ))}
          </View>
        </Card>

        <Card>
          <CardTitle>Weekly Skills Progress</CardTitle>
          <Muted>
            Accuracy upticks, ball-control volume, and shot conversion changes
            will appear here.
          </Muted>
        </Card>

        <Card>
          <CardTitle>Hours Practiced This Week</CardTitle>
          <Muted>
            Total minutes/hours across your logged soccer sessions will show
            here.
          </Muted>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Pressable onPress={cycleDrill} hitSlop={8}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    color: DRILL_COLORS[drill],
                    textDecorationLine: "underline",
                    marginBottom: 3,
                  }}
                >
                  {DRILL_LABELS[drill]}
                </Text>
              </Pressable>
              <ProgressRing
                size={170}
                strokeWidth={14}
                progress={progress}
               

               progressColor={DRILL_COLORS[drill]}
                centerText={centerText}
              />
              <Text style={{ marginTop: 8, color: "#666" }}>
                {drill === "shooting" ? "Shots today" : "Volume today"}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 10 }}>
              <MiniStat color="#58C6FF" label="Passing Accuracy" value="—" />
              <MiniStat color="#17D67F" label="Dribble Wins" value="—" />
              <MiniStat color="#FF5A5A" label="Minutes Practiced" value="—" />
            </View>
          </View>
        </Card>
      </ScrollView>

      <Fab
        label="Log session"
        onPress={() => {
          Haptics.selectionAsync();
          setShowLog(true);
        }}
      />

      <Modal
        visible={showLog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLog(false)}
      >
        <CenterModal>
          <Text style={{ fontSize: 18, fontWeight: "900", marginBottom: 12 }}>
            Log {DRILL_LABELS[drill]}
          </Text>
          <PrimaryButton
            onPress={() => {
              const bump = drill === "passing" ? 40 : drill === "dribbling" ? 30 : 20;
              setTotals({ ...totals, [drill]: totals[drill] + bump });
              setShowLog(false);
            }}
            label={`+${drill === "passing" ? 40 : drill === "dribbling" ? 30 : 20}`}
          />
          <Cancel onPress={() => setShowLog(false)} />
        </CenterModal>
      </Modal>
    </>
  );
}

/* ======================= HOCKEY HOME ======================= */
function HockeyHome() {
  type DrillKey = "skating" | "shooting" | "stickhandling";
  const [drill, setDrill] = useState<DrillKey>("skating");
  const [totals, setTotals] = useState({ skating: 0, shooting: 0, stickhandling: 0 });
  const [goals, setGoals] = useState({ skating: 30, shooting: 150, stickhandling: 200 });

  const DRILL_LABELS: Record<DrillKey, string> = {
    skating: "Skating Minutes",
    shooting: "Shooting Reps",
    stickhandling: "Stickhandling Touches",
  };
  const DRILL_COLORS: Record<DrillKey, string> = {
    skating: "#0ea5e9",
    shooting: "#FF5A5A",
    stickhandling: "#17D67F",
  };
  const DRILL_UNIT: Record<DrillKey, string> = {
    skating: "min",
    shooting: "shots",
    stickhandling: "touches",
  };

  const progress = Math.min(1, totals[drill] / goals[drill]);
  const centerText = `${totals[drill]}/${goals[drill]} ${DRILL_UNIT[drill]}`;
  const cycleDrill = () => {
    const order: DrillKey[] = ["skating", "shooting", "stickhandling"];
    const next = order[(order.indexOf(drill) + 1) % order.length];
    setDrill(next);
  };

  const days = getCurrentWeekStartingSunday();
  const sessionsByISO: Record<string, string | undefined> = {};
  const [showLog, setShowLog] = useState(false);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.xl,
          paddingBottom: 120,
          paddingTop: theme.layout.lg,
          gap: theme.layout.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text
            style={{
              ...theme.text.h1,
              color: theme.colors.textHi,
              textAlign: "center",
              marginBottom: theme.layout.lg,
            }}
          >
            Training This Week
          </Text>
          <View style={{ flexDirection: "row", gap: theme.layout.lg }}>
            {days.slice(0, 4).map((d, i) => (
              <DayTile key={i} date={d} workoutName={sessionsByISO[toISO(d)]} />
            ))}
          </View>
        </Card>

        <Card>
          <CardTitle>Weekly Skills Progress</CardTitle>
          <Muted>
            Edge control time, shot volume/accuracy, and puck control streaks
            will show here after two weeks.
          </Muted>
        </Card>

        <Card>
          <CardTitle>Hours Practiced This Week</CardTitle>
          <Muted>
            Total minutes/hours across your logged hockey sessions will show
            here.
          </Muted>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Pressable onPress={cycleDrill} hitSlop={8}>
                <Text style={{ fontSize: 18, fontWeight: "900", color: DRILL_COLORS[drill], textDecorationLine: "underline", marginBottom: 3 }}>
                  {DRILL_LABELS[drill]}
                </Text>
              </Pressable>
              <ProgressRing size={170} strokeWidth={14} progress={progress} centerText={centerText} />

              <Text style={{ marginTop: 8, color: "#666" }}>
                {drill === "skating" ? "Minutes today" : drill === "shooting" ? "Shots today" : "Touches today"}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 10 }}>
              <MiniStat color="#0ea5e9" label="Top Speed (est.)" value="—" />
              <MiniStat color="#FF5A5A" label="Shot Accuracy" value="—" />
              <MiniStat color="#17D67F" label="Minutes Practiced" value="—" />
            </View>
          </View>
        </Card>
      </ScrollView>

      <Fab
        label="Log session"
        onPress={() => {
          Haptics.selectionAsync();
          setShowLog(true);
        }}
      />

      <Modal
        visible={showLog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLog(false)}
      >
        <CenterModal>
          <Text style={{ fontSize: 18, fontWeight: "900", marginBottom: 12 }}>
            Log {DRILL_LABELS[drill]}
          </Text>
          <PrimaryButton
            onPress={() => {
              const bump = drill === "skating" ? 10 : drill === "shooting" ? 25 : 40;
              setTotals({ ...totals, [drill]: totals[drill] + bump });
              setShowLog(false);
            }}
            label={`+${drill === "skating" ? 10 : drill === "shooting" ? 25 : 40} ${DRILL_UNIT[drill]}`}
          />
          <Cancel onPress={() => setShowLog(false)} />
        </CenterModal>
      </Modal>
    </>
  );
}

/* ======================= SHARED LOCAL UI (small helpers) ======================= */
function CardTitle({ children }: { children: React.ReactNode }) {
  return <Text style={{ 
    ...theme.text.h2,
    color: theme.colors.textHi,
    marginBottom: theme.layout.sm,
  }}>{children}</Text>;
}
function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={{ 
    ...theme.text.muted,
    color: theme.colors.textLo,
  }}>{children}</Text>;
}
function MiniStat({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={{ padding: 12, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8e8e8", flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ fontSize: 14, fontWeight: "800", color: "#111", flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>{value}</Text>
    </View>
  );
}
function PillRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;
}
function Pill({ label }: { label: string }) {
  return (
    <View style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" }}>
      <Text style={{ fontSize: 13, fontWeight: "800", color: "#111" }}>{label}</Text>
    </View>
  );
}
function Fab({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        position: "absolute",
        right: 16,
        bottom: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: pressed ? theme.colors.brandDim : theme.colors.brand,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      })}
    >
      <Ionicons name="add" size={18} color="#fff" />
      <Text style={{ color: "#fff", fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

/* Week grid helpers */
function DayTile({ date, workoutName }: { date: Date; workoutName?: string }) {
  const dd = date.getDate();
  const label = `${date.toLocaleString("en-US", { weekday: "short" })} ${dd}`;

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const borderColor = isToday ? theme.colors.primary600 : theme.colors.strokeSoft;
  const bgColor = isToday ? theme.colors.surface2 : theme.colors.surface1;

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        height: 96,
        borderRadius: theme.radii.lg,
        backgroundColor: bgColor,
        borderWidth: isToday ? 2 : 1,
        borderColor,
        padding: theme.layout.lg,
        justifyContent: "flex-start",
        ...theme.shadow.soft,
        ...(isToday ? {
          shadowColor: theme.colors.primary600,
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        } : {}),
      }}
    >
      <Text
        style={{
          position: "absolute",
          top: theme.layout.sm,
          left: theme.layout.lg,
          ...theme.text.label,
          color: isToday ? theme.colors.primary600 : theme.colors.textLo,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: theme.layout.xs }}>
        <Text
          style={{
            ...theme.text.muted,
            color: workoutName ? theme.colors.textHi : theme.colors.textLo,
            textAlign: "center",
          }}
        >
          {workoutName ?? "—"}
        </Text>
      </View>
    </View>
  );
}

function StreakTile() {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        height: 96,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.surface2,
        borderWidth: 1,
        borderColor: theme.colors.strokeSoft,
        padding: theme.layout.lg,
        ...theme.shadow.soft,
        shadowColor: theme.colors.primary600,
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      <Text
        style={{
          position: "absolute",
          top: theme.layout.xs,
          left: theme.layout.lg,
          ...theme.text.label,
          color: theme.colors.textLo,
        }}
        numberOfLines={1}
      >
        Workout Streak
      </Text>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={{ marginTop: theme.layout.xs, flexDirection: "row", alignItems: "center", gap: theme.layout.sm }}>
          <Ionicons 
            name="flame" 
            size={20} 
            color={theme.colors.primary600}
            style={{
              shadowColor: theme.colors.primary600,
              shadowOpacity: 0.6,
              shadowRadius: 4,
              elevation: 2,
            }}
          />
          <Text style={{ 
            ...theme.text.h2,
            color: theme.colors.primary600,
          }}>
            0
          </Text>
        </View>
      </View>
    </View>
  );
}

function getCurrentWeekStartingSunday(): Date[] {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setHours(0, 0, 0, 0);
  const day = sunday.getDay();
  sunday.setDate(sunday.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}
function toISO(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function CenterModal({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 20,
          width: "100%",
        }}
      >
        {children}
      </View>
    </View>
  );
}
function Cancel({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ marginTop: 10, alignItems: "center" }}>
      <Text style={{ color: "#666" }}>Cancel</Text>
    </Pressable>
  );
}
function ModeItem({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: pressed ? "#151b22" : "transparent",
      })}
    >
      {icon}
      <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.textHi, flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

























