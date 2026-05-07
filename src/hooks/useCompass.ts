import { useState, useEffect } from 'react';
import { magnetometer, SensorTypes, setUpdateIntervalForType } from 'react-native-sensors';
import type { Subscription } from 'rxjs';

export interface CompassState {
  heading: number;
  isReady: boolean;
}

const ALPHA = 0.15;

function smoothAngle(prev: number, next: number, alpha: number): number {
  let diff = next - prev;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (prev + alpha * diff + 360) % 360;
}

export function useCompass(): CompassState {
  const [state, setState] = useState<CompassState>({
    heading: 0,
    isReady: false,
  });

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.magnetometer, 100);

    let sub: Subscription | null = null;
    let smoothed = 0;
    let hasFirst = false;

    sub = magnetometer.subscribe(
      ({ x, y }) => {
        const raw = (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
        if (!hasFirst) {
          smoothed = raw;
          hasFirst = true;
        } else {
          smoothed = smoothAngle(smoothed, raw, ALPHA);
        }
        setState({ heading: smoothed, isReady: true });
      },
      (error: Error) => {
        console.warn('[useCompass] magnetometer unavailable:', error.message);
      },
    );

    return () => {
      sub?.unsubscribe();
    };
  }, []);

  return state;
}
