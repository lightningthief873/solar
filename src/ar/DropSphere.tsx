import React, { useEffect, useRef, useState } from 'react';
import {
  ViroNode,
  ViroSphere,
  ViroText,
} from '@reactvision/react-viro';
import type { Drop } from '../types';
import { RARITY_CONFIG } from '../utils/constants';
import { gpsToARPosition, haversineDistance } from '../utils/haversine';

const RARITY_SCALE: Record<Drop['rarity'], number> = {
  common: 0.35, rare: 0.42, legendary: 0.52, mythic: 0.65,
};
const RARITY_MATERIAL: Record<Drop['rarity'], string> = {
  common: 'glowBlue', rare: 'glowPurple', legendary: 'glowGold', mythic: 'glowRainbow',
};
const ORBIT_R: Record<Drop['rarity'], number> = {
  common: 0.55, rare: 0.65, legendary: 0.75, mythic: 0.90,
};

interface OrbitRingProps {
  material: string;
  count: number;
  orbitRadius: number;
  animation: string;
  verticalTilt?: number;
  sphereRadius?: number;
}

function OrbitRing({ material, count, orbitRadius, animation, verticalTilt = 0, sphereRadius = 0.08 }: OrbitRingProps) {
  const angles = Array.from({ length: count }, (_, i) => (i * 2 * Math.PI) / count);
  return (
    <ViroNode animation={{ name: animation, run: true, loop: true, delay: 0 }}>
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
  const distLabel = `${Math.round(distance)}m`;

  return (
    <ViroNode position={position} onClick={() => onTap(drop)}>
      {/* Outer halo */}
      <ViroSphere
        radius={mainR * 1.5}
        materials={['haloMat']}
        animation={{ name: 'haloPulse', run: true, loop: true, delay: 0 }}
      />

      {/* Main sphere */}
      <ViroSphere
        radius={mainR}
        materials={[mainMat]}
        animation={{ name: isClaimable ? 'goldPulse' : 'floatCycle', run: true, loop: true, delay: 0 }}
      />

      {r === 'common' && (
        <OrbitRing material="glowBlue" count={3} orbitRadius={orbitRadius} animation="orbitSlow" sphereRadius={0.07} />
      )}
      {r === 'rare' && (
        <OrbitRing material="glowPurple" count={6} orbitRadius={orbitRadius} animation="orbitFast" sphereRadius={0.06} />
      )}
      {r === 'legendary' && (
        <OrbitRing material="glowGold" count={8} orbitRadius={orbitRadius} animation="orbitFast" verticalTilt={0.25} sphereRadius={0.09} />
      )}
      {r === 'mythic' && (
        <>
          <OrbitRing material="glowRainbow" count={6} orbitRadius={orbitRadius * 0.8} animation="orbitFast" sphereRadius={0.08} />
          <OrbitRing material="glowPink" count={8} orbitRadius={orbitRadius * 1.25} animation="orbitReverse" sphereRadius={0.06} />
        </>
      )}

      {showShockwave && (
        <ViroSphere
          radius={mainR * 1.05}
          materials={['shockwaveMat']}
          animation={{ name: 'shockwave', run: true, loop: false, delay: 0, onFinish: () => setShowShockwave(false) }}
        />
      )}

      <ViroText
        text={isClaimable ? '◎ TAP TO CLAIM' : drop.name}
        position={[0, mainR + 0.45, 0]}
        scale={[0.65, 0.65, 0.65]}
        style={{ fontSize: 16, fontWeight: '800', textAlign: 'center', textAlignVertical: 'center' }}
        color={labelColor}
      />
      <ViroText
        text={isClaimable ? '✓ IN RANGE' : distLabel + ' away'}
        position={[0, mainR + 0.12, 0]}
        scale={[0.45, 0.45, 0.45]}
        style={{ fontSize: 13, fontWeight: '600', textAlign: 'center', textAlignVertical: 'center' }}
        color={isClaimable ? '#00FF88' : 'rgba(255,255,255,0.75)'}
      />
    </ViroNode>
  );
}
