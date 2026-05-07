import React from 'react';
import { StyleSheet } from 'react-native';
import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroAnimations,
  ViroMaterials,
} from '@reactvision/react-viro';
import { DropSphere } from './DropSphere';
import type { Drop } from '../types';

ViroMaterials.createMaterials({
  glowBlue:     { diffuseColor: '#4A90E2', lightingModel: 'Constant' },
  glowPurple:   { diffuseColor: '#9B59B6', lightingModel: 'Constant' },
  glowGold:     { diffuseColor: '#F39C12', lightingModel: 'Constant' },
  glowRainbow:  { diffuseColor: '#FF69B4', lightingModel: 'Constant' },
  glowClaimable:{ diffuseColor: '#FFD700', lightingModel: 'Constant' },
});

ViroAnimations.registerAnimations({
  floatCycle: [
    { duration: 1000, easing: 'EaseInEaseOut', properties: { translateY: '0.1' } },
    { duration: 1000, easing: 'EaseInEaseOut', properties: { translateY: '-0.1' } },
  ],
  fastSpin: { duration: 800,  easing: 'Linear', properties: { rotateY: '360' } },
  legendaryPulse: [
    { duration: 500, easing: 'EaseInEaseOut', properties: { scaleX: '1.3', scaleY: '1.3', scaleZ: '1.3' } },
    { duration: 500, easing: 'EaseInEaseOut', properties: { scaleX: '0.9', scaleY: '0.9', scaleZ: '0.9' } },
  ],
  mythicSpin: { duration: 600, easing: 'Linear', properties: { rotateY: '360' } },
  goldPulse: [
    { duration: 300, easing: 'EaseInEaseOut', properties: { scaleX: '1.2', scaleY: '1.2', scaleZ: '1.2' } },
    { duration: 300, easing: 'EaseInEaseOut', properties: { scaleX: '0.9', scaleY: '0.9', scaleZ: '0.9' } },
  ],
});

export interface ARSceneProps {
  drops: Drop[];
  userLat: number;
  userLng: number;
  compassHeading: number;
  onDropTap: (drop: Drop) => void;
}

interface SceneNav {
  viroAppProps: ARSceneProps;
}

function SolARScene(props: Record<string, unknown>): React.JSX.Element {
  const { drops, userLat, userLng, compassHeading, onDropTap } =
    (props.sceneNavigator as SceneNav).viroAppProps;

  return (
    <ViroARScene>
      {drops.map(drop => (
        <DropSphere
          key={drop.id}
          drop={drop}
          userLat={userLat}
          userLng={userLng}
          compassHeading={compassHeading}
          onTap={onDropTap}
        />
      ))}
    </ViroARScene>
  );
}

export function ARScene(props: ARSceneProps): React.JSX.Element {
  return (
    <ViroARSceneNavigator
      autofocus
      initialScene={{ scene: SolARScene as unknown as () => React.JSX.Element }}
      viroAppProps={props}
      style={StyleSheet.absoluteFill}
    />
  );
}
