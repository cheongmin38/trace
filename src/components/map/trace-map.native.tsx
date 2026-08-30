import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, type Region } from 'react-native-maps';
import { MemoryMarker } from '@/components/map/memory-marker';
import { useTraceTheme } from '@/theme';
import type { MapVisitPin, RoutePoint } from '@/types/location';
import type { Coordinates } from '@/types/trace';

type TraceMapProps = {
  pins: MapVisitPin[];
  selectedId?: string;
  onSelect: (pin: MapVisitPin) => void;
  fitKey?: number;
  currentLocation?: Coordinates | null;
  routePoints?: RoutePoint[];
  exploration?: boolean;
};

type PinCluster = {
  id: string;
  latitude: number;
  longitude: number;
  pins: MapVisitPin[];
};

const KOREA_REGION: Region = {
  latitude: 36.35,
  longitude: 127.75,
  latitudeDelta: 7.2,
  longitudeDelta: 6.2,
};

function clusterPins(pins: MapVisitPin[], region: Region): PinCluster[] {
  // Native MapView custom photo markers are expensive in dense, zoomed-out regions.
  // A geographic grid keeps the number of rendered views bounded until the user zooms in.
  const cellSize = Math.max(0.025, Math.min(1.25, region.latitudeDelta / 5));
  const buckets = new Map<string, MapVisitPin[]>();

  pins.forEach((pin) => {
    const key = `${Math.floor(pin.latitude / cellSize)}:${Math.floor(pin.longitude / cellSize)}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(pin);
    buckets.set(key, bucket);
  });

  return Array.from(buckets.entries()).map(([id, groupedPins]) => ({
    id,
    latitude: groupedPins.reduce((total, pin) => total + pin.latitude, 0) / groupedPins.length,
    longitude: groupedPins.reduce((total, pin) => total + pin.longitude, 0) / groupedPins.length,
    pins: groupedPins,
  }));
}

export function TraceMap({ pins, selectedId, onSelect, fitKey = 0, currentLocation, routePoints = [], exploration = false }: TraceMapProps) {
  const mapRef = useRef<MapView>(null);
  const { colors } = useTraceTheme();
  const [region, setRegion] = useState<Region>(KOREA_REGION);
  const clusters = useMemo(() => clusterPins(pins, region), [pins, region]);
  const useClusters = region.latitudeDelta > 0.42 && pins.length > 12;

  useEffect(() => {
    const selected = pins.find((pin) => pin.placeId === selectedId);
    if (selected) {
      mapRef.current?.animateToRegion({ latitude: selected.latitude, longitude: selected.longitude, latitudeDelta: 0.035, longitudeDelta: 0.035 }, 340);
    }
  }, [pins, selectedId]);

  useEffect(() => {
    if (fitKey && pins.length) {
      mapRef.current?.fitToCoordinates(
        pins.map((pin) => ({ latitude: pin.latitude, longitude: pin.longitude })),
        { edgePadding: { top: 72, right: 56, bottom: 88, left: 56 }, animated: true },
      );
    }
  }, [fitKey, pins]);

  useEffect(() => {
    if (currentLocation) {
      mapRef.current?.animateToRegion({ latitude: currentLocation.latitude, longitude: currentLocation.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 420);
    }
  }, [currentLocation]);

  const zoomIntoCluster = (cluster: PinCluster) => {
    mapRef.current?.animateToRegion({
      latitude: cluster.latitude,
      longitude: cluster.longitude,
      latitudeDelta: Math.max(0.04, region.latitudeDelta / 3),
      longitudeDelta: Math.max(0.04, region.longitudeDelta / 3),
    }, 300);
  };

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={KOREA_REGION}
        onRegionChangeComplete={setRegion}
        showsUserLocation={Boolean(currentLocation)}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        minZoomLevel={5}
        maxZoomLevel={18}
      >
        {exploration && routePoints.length > 1 ? <Polyline coordinates={routePoints.map((point) => ({ latitude: point.latitude, longitude: point.longitude }))} strokeColor={colors.accent} strokeWidth={4} lineCap="round" lineJoin="round" /> : null}
        {useClusters
          ? clusters.map((cluster) => cluster.pins.length > 1 ? (
            <Marker key={`cluster-${cluster.id}`} coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }} onPress={() => zoomIntoCluster(cluster)} tracksViewChanges={false}>
              <View style={[styles.cluster, { backgroundColor: colors.accent, borderColor: colors.surface }]}>
                <Text style={[styles.clusterText, { color: colors.onAccent }]}>{cluster.pins.length}</Text>
              </View>
            </Marker>
          ) : (
            <Marker key={cluster.pins[0].id} coordinate={{ latitude: cluster.pins[0].latitude, longitude: cluster.pins[0].longitude }} onPress={() => onSelect(cluster.pins[0])} tracksViewChanges={selectedId === cluster.pins[0].placeId}>
              <MemoryMarker pin={cluster.pins[0]} selected={selectedId === cluster.pins[0].placeId} />
            </Marker>
          ))
          : pins.map((pin) => (
            <Marker key={pin.id} coordinate={{ latitude: pin.latitude, longitude: pin.longitude }} onPress={() => onSelect(pin)} tracksViewChanges={selectedId === pin.placeId}>
              <MemoryMarker pin={pin} selected={selectedId === pin.placeId} />
            </Marker>
          ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  cluster: { minWidth: 38, height: 38, paddingHorizontal: 8, borderRadius: 19, borderWidth: 3, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  clusterText: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
