import React from 'react';
import { StyleSheet } from 'react-native';
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
  common: 0.15,
  rare: 0.18,
  legendary: 0.22,
  mythic: 0.28,
};

const RARITY_MATERIAL: Record<Drop['rarity'], string> = {
  common: 'glowBlue',
  rare: 'glowPurple',
  legendary: 'glowGold',
  mythic: 'glowRainbow',
};

const RARITY_ANIM: Record<Drop['rarity'], string> = {
  common: 'floatCycle',
  rare: 'fastSpin',
  legendary: 'legendaryPulse',
  mythic: 'mythicSpin',
};

interface Props {
  drop: Drop;
  userLat: number;
  userLng: number;
  compassHeading: number;
  onTap: (drop: Drop) => void;
}

export function DropSphere({
  drop,
  userLat,
  userLng,
  compassHeading,
  onTap,
}: Props): React.JSX.Element {
  const position = gpsToARPosition(
    userLat,
    userLng,
    drop.lat,
    drop.lng,
    compassHeading,
  );
  const distance = haversineDistance(userLat, userLng, drop.lat, drop.lng);
  const isClaimable = distance <= drop.claimRadius;

  const material = isClaimable ? 'glowClaimable' : RARITY_MATERIAL[drop.rarity];
  const animation = isClaimable ? 'goldPulse' : RARITY_ANIM[drop.rarity];
  const radius = RARITY_SCALE[drop.rarity];

  return (
    <ViroNode position={position} onClick={() => onTap(drop)}>
      <ViroAnimatedComponent animation={animation} run loop delay={0} onStart={() => {}} onFinish={() => {}}>
        <ViroSphere radius={radius} materials={[material]} />
      </ViroAnimatedComponent>
      <ViroText
        text={drop.name}
        position={[0, radius + 0.12, 0]}
        scale={[0.4, 0.4, 0.4]}
        style={styles.label}
        color={RARITY_CONFIG[drop.rarity].color}
      />
    </ViroNode>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
