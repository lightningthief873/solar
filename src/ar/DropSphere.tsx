import React, { useEffect, useRef, useState } from 'react';
import {
  ViroAnimatedComponent,
  ViroNode,
  ViroSphere,
  ViroText,
} from '@reactvision/react-viro';
import type { Drop } from '../types';
import { RARITY_CONFIG } from '../utils/constants';
import { gpsToARPosition, haversineDistance } from '../utils/haversine';

const RARITY_SCALE: Record<Drop['rarity'], number> = {
  common: 0.15, rare: 0.18, legendary: 0.22, mythic: 0.28,
};
const RARITY_MATERIAL: Record<Drop['rarity'], string> = {
  common: 'glowBlue', rare: 'glowPurple', legendary: 'glowGold', mythic: 'glowRainbow',
};
const ORBIT_R: Record<Drop['rarity'], number> = {
  common: 0.28, rare: 0.32, legendary: 0.36, mythic: 0.4,
};

interface OrbitRingProps {
  material: string;
  count: number;
  orbitRadius: number;
  animation: string;
  verticalTilt?: number;
  sphereRadius?: number;
}

function OrbitRing({ material, count, orbitRadius, animation, verticalTilt = 0, sphereRadius = 0.04 }: OrbitRingProps) {
  const angles = Array.from({ length: count }, (_, i) => (i * 2 * Math.PI) / count);
  return (
    <ViroAnimatedComponent animation={animation} run loop delay={0} onStart={() => {}} onFinish={() => {}}>
      <ViroNode>
        {angles.map((a, i) => (
          <ViroSphere
            key={i}
            position={[
              orbitRadius * Math.cos(a),
              verticalTilt * Math.sin(2 * a),
              orbitRadius * Math.sin(a),
            ]}
            radius={sphereRadius}
            materials={[material]}
          />
        ))}
      </ViroNode>
    </ViroAnimatedComponent>
  );
}

interface Props {
  drop: Drop;
  userLat: number;
  userLng: number;
  compassHeading: number;
  onTap: (drop: Drop) => void;
  onEnterRange?: (drop: Drop) => void;
}

export function DropSphere({ drop, userLat, userLng, compassHeading, onTap, onEnterRange }: Props): React.JSX.Element {
  const position = gpsToARPosition(userLat, userLng, drop.lat, drop.lng, compassHeading);
  const distance = haversineDistance(userLat, userLng, drop.lat, drop.lng);
  const isClaimable = distance <= drop.claimRadius;
  const prevClaimable = useRef(false);
  const [showShockwave, setShowShockwave] = useState(false);
  const onEnterRef = useRef(onEnterRange);
  onEnterRef.current = onEnterRange;

  useEffect(() => {
    if (isClaimable && !prevClaimable.current) {
      onEnterRef.current?.(drop);
      setShowShockwave(true);
    }
    prevClaimable.current = isClaimable;
  }, [isClaimable, drop]);

  const r = drop.rarity;
  const mainMat = isClaimable ? 'glowClaimable' : RARITY_MATERIAL[r];
  const mainR = RARITY_SCALE[r];
  const orbitRadius = ORBIT_R[r];
  const labelColor = isClaimable ? '#00FF88' : RARITY_CONFIG[r].color;

  return (
    <ViroNode position={position} onClick={() => onTap(drop)}>
      {/* Main sphere */}
      <ViroAnimatedComponent animation={isClaimable ? 'goldPulse' : 'floatCycle'} run loop delay={0} onStart={() => {}} onFinish={() => {}}>
        <ViroSphere radius={mainR} materials={[mainMat]} />
      </ViroAnimatedComponent>

      {/* Common: 3 slow-orbiting blue satellites */}
      {r === 'common' && (
        <OrbitRing material="glowBlue" count={3} orbitRadius={orbitRadius} animation="orbitSlow" />
      )}

      {/* Rare: 6 fast purple sparkles */}
      {r === 'rare' && (
        <OrbitRing material="glowPurple" count={6} orbitRadius={orbitRadius} animation="orbitFast" sphereRadius={0.03} />
      )}

      {/* Legendary: 8 gold, vertically tilted fountain */}
      {r === 'legendary' && (
        <OrbitRing material="glowGold" count={8} orbitRadius={orbitRadius} animation="orbitFast" verticalTilt={0.18} sphereRadius={0.05} />
      )}

      {/* Mythic: inner CW ring + outer CCW ring */}
      {r === 'mythic' && (
        <>
          <OrbitRing material="glowRainbow" count={6} orbitRadius={orbitRadius * 0.8} animation="orbitFast" sphereRadius={0.04} />
          <OrbitRing material="glowPink" count={8} orbitRadius={orbitRadius * 1.25} animation="orbitReverse" sphereRadius={0.03} />
        </>
      )}

      {/* Shockwave: one-shot ring on entering claim range */}
      {showShockwave && (
        <ViroAnimatedComponent animation="shockwave" run loop={false} delay={0} onStart={() => {}} onFinish={() => setShowShockwave(false)}>
          <ViroSphere radius={mainR * 1.05} materials={['shockwaveMat']} />
        </ViroAnimatedComponent>
      )}

      {/* Label / tap hint */}
      <ViroText
        text={isClaimable ? '◎ Tap to claim' : drop.name}
        position={[0, mainR + 0.18, 0]}
        scale={[0.4, 0.4, 0.4]}
        style={{ fontSize: 14, fontWeight: '600', textAlign: 'center', textAlignVertical: 'center' }}
        color={labelColor}
      />
    </ViroNode>
  );
}
