// app/(tabs)/scan.tsx — Barcode Nutrition MVP using expo-camera, with torch/flip + add guard
// Install first:  npx expo install expo-camera expo-haptics

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

// ---- Types ----
type Nutriments = {
  calories?: number | null;
  protein?: number | null; // g
  carbs?: number | null;   // g
  fat?: number | null;     // g
  fiber?: number | null;   // g
  sugar?: number | null;   // g
  sodium?: number | null;  // g
};

type ScanProduct = {
  ok: boolean;
  barcode: string;
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  servingSize?: string | null;
  perServing?: Nutriments;
  per100g?: Nutriments;
};

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ScanProduct | null>(null);

  // NEW: camera controls
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  // NEW: guard against rapid double "Add to Meals"
  const [adding, setAdding] = useState(false);

  // Ask for permissions on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const onScan = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      if (scanned) return; // prevent double trigger
      setScanned(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);
      setError(null);
      try {
        const info = await lookupOpenFoodFacts(data);
        setProduct(info);
        if (!info.ok) setError('Product not found. You can rescan or add manually.');
      } catch (e: any) {
        setError(e?.message || 'Scan failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [scanned]
  );

  const addToMeals = useCallback(() => {
    if (adding || !product) return;
    setAdding(true);

    const entry = {
      name: product.name || 'Food item',
      brand: product.brand || undefined,
      barcode: product.barcode,
      servingSize: product.servingSize || undefined,
      calories: product.perServing?.calories ?? product.per100g?.calories ?? null,
      protein:  product.perServing?.protein  ?? product.per100g?.protein  ?? null,
      carbs:    product.perServing?.carbs    ?? product.per100g?.carbs    ?? null,
      fat:      product.perServing?.fat      ?? product.per100g?.fat      ?? null,
      fiber:    product.perServing?.fiber    ?? product.per100g?.fiber    ?? null,
      sugar:    product.perServing?.sugar    ?? product.per100g?.sugar    ?? null,
      sodium:   product.perServing?.sodium   ?? product.per100g?.sodium   ?? null,
      source: 'barcode',
      createdAt: new Date().toISOString(),
    };

    // Pass entry to Meals via URL param; Meals screen will ingest it.
    try {
      const payload = encodeURIComponent(JSON.stringify(entry));
      router.push({ pathname: '/(tabs)/meals', params: { add: payload } });
    } catch {
      Alert.alert('Could not prepare item', 'Open Meals and add manually.');
    } finally {
      setAdding(false);
    }
  }, [adding, product, router]);

  // WEB fallback (CameraView is native only)
  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Scanner not available on web preview</Text>
        <Text style={styles.dim}>Open this project in Expo Go on your phone to use the camera.</Text>
      </View>
    );
  }

  // Permission states
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.dim}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.dim}>Enable camera permission in Settings to scan barcodes.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!scanned ? (
        <View style={styles.scannerWrap}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            enableTorch={torch}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
            }}
            onBarcodeScanned={onScan}
          />

          {/* Top-right controls: Torch + Flip */}
          <View style={styles.topRight}>
            <TouchableOpacity
              onPress={() => setTorch(t => !t)}
              style={styles.pillBtn}
            >
              <Text style={styles.pillText}>{torch ? 'Torch ON' : 'Torch'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}
              style={styles.pillBtn}
            >
              <Text style={styles.pillText}>Flip</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom helper + frame */}
          <View style={styles.overlay}>
            <View style={styles.frame} />
            <Text style={styles.helper}>Align barcode within the frame</Text>
          </View>
        </View>
      ) : null}

      {(loading || product || error) && (
        <ScrollView style={styles.panel} contentContainerStyle={{ padding: 16 }}>
          {loading && (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={[styles.dim, { marginTop: 8 }]}>Looking up nutrition…</Text>
            </View>
          )}

          {!!error && !loading && (
            <View style={styles.card}>
              <Text style={styles.error}>{error}</Text>
            </View>
          )}

          {!!product && !loading && (
            <View style={{ gap: 12 }}>
              <View style={styles.card}>
                <Text style={styles.title}>{product.name}</Text>
                {!!product.brand && <Text style={styles.dim}>{product.brand}</Text>}
                {!!product.servingSize && <Text style={styles.dim}>Serving size: {product.servingSize}</Text>}
              </View>

              <View style={styles.card}>
                <Text style={styles.section}>Macros (per serving if available)</Text>
                {macroRow('Calories', product.perServing?.calories ?? product.per100g?.calories, 'kcal')}
                {macroRow('Protein',  product.perServing?.protein  ?? product.per100g?.protein,  'g')}
                {macroRow('Carbs',    product.perServing?.carbs    ?? product.per100g?.carbs,    'g')}
                {macroRow('Fat',      product.perServing?.fat      ?? product.per100g?.fat,      'g')}
                {macroRow('Fiber',    product.perServing?.fiber    ?? product.per100g?.fiber,    'g')}
                {macroRow('Sugar',    product.perServing?.sugar    ?? product.per100g?.sugar,    'g')}
                {macroRow('Sodium',   product.perServing?.sodium   ?? product.per100g?.sodium,   'g')}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, adding && { opacity: 0.6 }]}
                onPress={addToMeals}
                disabled={adding}
              >
                <Text style={styles.primaryBtnText}>{adding ? 'Adding…' : 'Add to Meals'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => { setScanned(false); setProduct(null); setError(null); }}
              >
                <Text style={styles.secondaryBtnText}>Rescan</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function macroRow(label: string, value?: number | null, unit?: string) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value != null ? `${round(value)} ${unit || ''}` : '—'}</Text>
    </View>
  );
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

// ---- Nutrition lookup (Open Food Facts) ----
async function lookupOpenFoodFacts(barcode: string): Promise<ScanProduct> {
  const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`;
  const res = await fetch(url);
  const json = await res.json();

  if (!json || json.status !== 1) {
    return { ok: false, barcode, name: 'Unknown product', perServing: {}, per100g: {} } as ScanProduct;
  }

  const p = json.product || {};
  const n = p.nutriments || {};

  // --- Per 100g ---
  const energyKcal100 = num(n['energy-kcal_100g']);
  const energyKJ100   = num(n['energy_100g']);
  const salt100g      = num(n['salt_100g']); // may be null

  const per100g: Nutriments = {
    calories: energyKcal100 ?? kjToKcal(energyKJ100),
    protein:  num(n['proteins_100g']),
    carbs:    num(n['carbohydrates_100g']),
    fat:      num(n['fat_100g']),
    fiber:    num(n['fiber_100g']),
    sugar:    num(n['sugars_100g']),
    sodium:   num(n['sodium_100g']) ?? (salt100g != null ? salt100g / 2.5 : null),
  };

  // --- Per serving ---
  const energyKcalServ = num(n['energy-kcal_serving']);
  const energyKJServ   = num(n['energy_serving']);
  const saltServ       = num(n['salt_serving']); // may be null

  const perServing: Nutriments = {
    calories: energyKcalServ ?? kjToKcal(energyKJServ),
    protein:  num(n['proteins_serving']),
    carbs:    num(n['carbohydrates_serving']),
    fat:      num(n['fat_serving']),
    fiber:    num(n['fiber_serving']),
    sugar:    num(n['sugars_serving']),
    sodium:   num(n['sodium_serving']) ?? (saltServ != null ? saltServ / 2.5 : null),
  };

  return {
    ok: true,
    barcode,
    name: p.product_name || p.generic_name || 'Scanned product',
    brand: p.brands || null,
    imageUrl: p.image_front_url || p.image_url || null,
    servingSize: p.serving_size || null,
    perServing,
    per100g,
  } as ScanProduct;
}

function num(x: any): number | null {
  const v = typeof x === 'string' ? parseFloat(x) : typeof x === 'number' ? x : NaN;
  return isFinite(v) ? v : null;
}

function kjToKcal(kj: number | null): number | null {
  return kj == null ? null : Math.round((kj / 4.184) * 10) / 10;
}

// ---- Styles (Dark with glowing green accent) ----
const DARK = '#0a0f14';
const CARD = '#111822';
const TEXT = '#e6f1ff';
const DIM = '#8aa0b5';
const GREEN = '#2bf996';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  scannerWrap: { flex: 1, minHeight: 280, position: 'relative' },

  // Moved down by 16px (was top: 16)
  topRight: {
    position: 'absolute',
    top: 32,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  pillText: { color: '#fff', fontWeight: '800' },

  overlay: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 24 },
  frame: { width: 240, height: 160, borderColor: GREEN, borderWidth: 2, borderRadius: 12, position: 'absolute', top: '30%' },
  helper: { color: DIM, marginTop: 8 },

  panel: { backgroundColor: DARK, flex: 1 },
  card: { backgroundColor: CARD, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1a2430', marginBottom: 12 },
  title: { color: TEXT, fontSize: 18, fontWeight: '800' },
  section: { color: TEXT, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  dim: { color: DIM },
  error: { color: '#ff6b6b', fontWeight: '700' },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: TEXT, fontSize: 14 },
  rowValue: { color: GREEN, fontSize: 14, fontWeight: '800' },

  primaryBtn: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#052d1b', fontWeight: '900', fontSize: 16 },

  secondaryBtn: { backgroundColor: '#0b121a', borderRadius: 14, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1a2430' },
  secondaryBtnText: { color: TEXT, fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});








