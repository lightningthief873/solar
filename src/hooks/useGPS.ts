import { useState, useEffect } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';

export interface GPSState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  isReady: boolean;
}

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const perm = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  const status = await check(perm);
  if (status === RESULTS.GRANTED) return true;
  if (status === RESULTS.DENIED) {
    const result = await request(perm);
    return result === RESULTS.GRANTED;
  }
  return false;
}

export function useGPS(): GPSState {
  const [state, setState] = useState<GPSState>({
    lat: null,
    lng: null,
    accuracy: null,
    isReady: false,
  });

  useEffect(() => {
    let watchId: number | null = null;

    ensurePermission().then(granted => {
      if (!granted) return;

      watchId = Geolocation.watchPosition(
        position => {
          setState({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            isReady: true,
          });
        },
        error => {
          console.warn('[useGPS] error:', error.message);
        },
        {
          enableHighAccuracy: true,
          interval: 500,
          fastestInterval: 250,
          distanceFilter: 0,
        },
      );
    });

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return state;
}
