import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { colors } from "./ItineraryScreen.styles";

interface Location {
  id: string;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  type?: "itinerary" | "user-added";
  weather?: {
    temperature: number;
    condition: string;
    humidity: number;
  };
}

interface MapModalProps {
  visible: boolean;
  onClose: () => void;
  itineraryData: any;
  options?: any; // Original options data with coordinates
}

// Sample coordinates for Italian cities (you can replace with actual coordinates)
const CITY_COORDINATES = {
  Milan: { latitude: 45.4642, longitude: 9.19 },
  Venice: { latitude: 45.4408, longitude: 12.3155 },
  Florence: { latitude: 43.7696, longitude: 11.2558 },
  Rome: { latitude: 41.9028, longitude: 12.4964 },
  Naples: { latitude: 40.8518, longitude: 14.2681 },
  Bologna: { latitude: 44.4949, longitude: 11.3426 },
};

// Sample weather data (in a real app, you'd fetch this from a weather API)
const getSampleWeather = (cityName: string) => ({
  temperature: Math.floor(Math.random() * 15) + 15, // 15-30°C
  condition: ["Sunny", "Partly Cloudy", "Cloudy", "Clear"][
    Math.floor(Math.random() * 4)
  ],
  humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
});

export default function MapModal({
  visible,
  onClose,
  itineraryData,
  options,
}: MapModalProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [region, setRegion] = useState({
    latitude: 45.4642,
    longitude: 9.19,
    latitudeDelta: 0.02, // Much more zoomed in for street level
    longitudeDelta: 0.02, // Much more zoomed in for street level
  });
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = React.useRef<MapView>(null);

  useEffect(() => {
    if (visible && itineraryData?.days) {
      generateItineraryLocations();
    }
  }, [visible, itineraryData, options]);

  useEffect(() => {
    if (locations.length > 0) {
      calculateOptimalRegion();
    }
  }, [locations]);

  const generateItineraryLocations = () => {
    const itineraryLocations: Location[] = [];

    // Create a lookup map for original options data
    const optionsLookup = new Map();

    // Build lookup from restaurants
    if (options?.restaurants) {
      options.restaurants.forEach((restaurant: any) => {
        const key = restaurant.title || restaurant.name;
        if (key) {
          optionsLookup.set(key, restaurant);
        }
      });
    }

    // Build lookup from activities
    if (options?.activities) {
      options.activities.forEach((activity: any) => {
        const key = activity.title || activity.name;
        if (key) {
          optionsLookup.set(key, activity);
        }
      });
    }

    console.log(
      "🗺️ MapModal: Generated lookup with",
      optionsLookup.size,
      "options"
    );

    itineraryData.days.forEach((day: any) => {
      if (day.activities) {
        day.activities.forEach((activity: any, index: number) => {
          // Try to find the original option data with coordinates
          const originalOption = optionsLookup.get(activity.title);

          let coordinates;
          let hasExactCoordinates = false;

          if (originalOption && originalOption.lat && originalOption.lng) {
            // Use actual coordinates from the original option
            coordinates = {
              latitude: originalOption.lat,
              longitude: originalOption.lng,
            };
            hasExactCoordinates = true;
            console.log(
              `📍 Exact coordinates for ${activity.title}:`,
              coordinates
            );
          } else {
            // Fallback to city coordinates with small variation
            const cityCoords =
              CITY_COORDINATES[day.city as keyof typeof CITY_COORDINATES] ||
              CITY_COORDINATES.Milan;

            const variation = 0.005; // Smaller variation for fallback
            coordinates = {
              latitude: cityCoords.latitude + (Math.random() - 0.5) * variation,
              longitude:
                cityCoords.longitude + (Math.random() - 0.5) * variation,
            };
            console.log(
              `📍 Fallback coordinates for ${activity.title} in ${day.city}:`,
              coordinates
            );
          }

          itineraryLocations.push({
            id: `day-${day.day}-activity-${index}`,
            name: activity.title,
            coordinates,
            description: activity.description || activity.notes,
            type: "itinerary",
            weather: getSampleWeather(day.city),
          });
        });
      }
    });

    console.log(
      "🗺️ MapModal: Generated",
      itineraryLocations.length,
      "locations for map"
    );
    setLocations(itineraryLocations);
  };

  const calculateOptimalRegion = () => {
    if (locations.length === 0) return;

    const latitudes = locations.map((loc) => loc.coordinates.latitude);
    const longitudes = locations.map((loc) => loc.coordinates.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calculate the spread of locations
    const latSpread = maxLat - minLat;
    const lngSpread = maxLng - minLng;

    // Default to street-level zoom (0.02 delta)
    let latDelta = 0.02;
    let lngDelta = 0.02;

    // If locations are spread across multiple cities, zoom out accordingly
    if (latSpread > 0.1 || lngSpread > 0.1) {
      // Multi-city trip - zoom out to show multiple cities
      const padding = 0.05;
      latDelta = Math.max(latSpread + padding, 0.3);
      lngDelta = Math.max(lngSpread + padding, 0.3);
    } else if (latSpread > 0.02 || lngSpread > 0.02) {
      // Single city with some spread - moderate zoom
      const padding = 0.01;
      latDelta = Math.max(latSpread + padding, 0.05);
      lngDelta = Math.max(lngSpread + padding, 0.05);
    }
    // Otherwise use default street-level zoom (0.02)

    setRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    });
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setIsLoading(true);

    try {
      // Simulate API call to get place name and weather
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newLocation: Location = {
        id: `user-added-${Date.now()}`,
        name: "Custom Location",
        coordinates: { latitude, longitude },
        description: `Custom location added by user`,
        type: "user-added",
        weather: getSampleWeather("Custom Location"),
      };

      setLocations((prev) => [...prev, newLocation]);
      setSelectedLocation(newLocation);

      // Zoom to the new location
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to add location");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkerPress = (location: Location) => {
    setSelectedLocation(location);
  };

  const getMarkerColor = (type: "itinerary" | "user-added") => {
    return type === "itinerary" ? colors.accent : "#4CAF50";
  };

  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: region.latitudeDelta * 0.5,
        longitudeDelta: region.longitudeDelta * 0.5,
      });
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2,
      });
    }
  };

  const renderLocationInfo = () => {
    if (!selectedLocation) return null;

    return (
      <View style={styles.locationInfo}>
        <View style={styles.locationHeader}>
          <Text style={styles.locationName}>{selectedLocation.name}</Text>
          <TouchableOpacity
            onPress={() => setSelectedLocation(null)}
            style={styles.closeInfoButton}
          >
            <Ionicons name="close" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.locationDescription}>
          {selectedLocation.description}
        </Text>

        {selectedLocation.weather && (
          <View style={styles.weatherInfo}>
            <Ionicons name="partly-sunny" size={16} color={colors.accent} />
            <Text style={styles.weatherText}>
              {selectedLocation.weather.temperature}°C •{" "}
              {selectedLocation.weather.condition}
            </Text>
          </View>
        )}

        <View style={styles.locationType}>
          <View
            style={[
              styles.typeIndicator,
              { backgroundColor: getMarkerColor(selectedLocation.type!) },
            ]}
          />
          <Text style={styles.typeText}>
            {selectedLocation.type === "itinerary"
              ? "Itinerary Location"
              : "Custom Location"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Map</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            region={region}
            onPress={handleMapPress}
            onRegionChangeComplete={setRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
          >
            {locations.map((location) => (
              <Marker
                key={location.id}
                coordinate={location.coordinates}
                onPress={() => handleMarkerPress(location)}
                pinColor={getMarkerColor(location.type!)}
                title={location.name}
                description={location.description}
              />
            ))}
          </MapView>

          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
              <Ionicons name="add" size={24} color={colors.surface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
              <Ionicons name="remove" size={24} color={colors.surface} />
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Adding location...</Text>
            </View>
          )}
        </View>

        {/* Location Info Panel */}
        {renderLocationInfo()}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Tap anywhere on the map to add a custom location
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgTop,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  locationInfo: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  closeInfoButton: {
    padding: 4,
  },
  locationDescription: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 12,
    lineHeight: 20,
  },
  weatherInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  weatherText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 6,
    fontWeight: "500",
  },
  locationType: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  typeText: {
    fontSize: 12,
    color: colors.subtext,
    fontWeight: "500",
  },
  instructions: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  instructionText: {
    fontSize: 14,
    color: colors.accent,
    textAlign: "center",
    fontWeight: "500",
  },
  zoomControls: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "column",
    gap: 8,
  },
  zoomButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
