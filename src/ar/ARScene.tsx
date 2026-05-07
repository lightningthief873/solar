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
  glowBlue:     { diffuseColor: '#6AB8FF', lightingModel: 'Constant' },
  glowPurple:   { diffuseColor: '#BF7FFF', lightingModel: 'Constant' },
  glowGold:     { diffuseColor: '#FFD700', lightingModel: 'Constant' },
  glowRainbow:  { diffuseColor: '#FF69B4', lightingModel: 'Constant' },
  glowPink:     { diffuseColor: '#FF1493', lightingModel: 'Constant' },
  glowClaimable:{ diffuseColor: '#00FF88', lightingModel: 'Constant' },
  shockwaveMat: { diffuseColor: '#00FFFF', lightingModel: 'Constant' },
  haloMat:      { diffuseColor: '#FFFFFF', lightingModel: 'Constant', blendMode: 'Add' },
});

ViroAnimations.registerAnimations({
  floatCycle: [
    { duration: 1000, easing: 'EaseInEaseOut', properties: { translateY: '0.1' } },
    { duration: 1000, easing: 'EaseInEaseOut', properties: { translateY: '-0.1' } },
  ],
  fastSpin:       { duration: 800,  easing: 'Linear', properties: { rotateY: '360' } },
  legendaryPulse: [
    { duration: 500, easing: 'EaseInEaseOut', properties: { scaleX: '1.3', scaleY: '1.3', scaleZ: '1.3' } },
    { duration: 500, easing: 'EaseInEaseOut', properties: { scaleX: '0.9', scaleY: '0.9', scaleZ: '0.9' } },
  ],
  mythicSpin:     { duration: 600,  easing: 'Linear', properties: { rotateY: '360' } },
  goldPulse:      [
    { duration: 300, easing: 'EaseInEaseOut', properties: { scaleX: '1.2', scaleY: '1.2', scaleZ: '1.2' } },
    { duration: 300, easing: 'EaseInEaseOut', properties: { scaleX: '0.9', scaleY: '0.9', scaleZ: '0.9' } },
  ],
  orbitSlow:    { duration: 4000, easing: 'Linear', properties: { rotateY: '360' } },
  orbitFast:    { duration: 1500, easing: 'Linear', properties: { rotateY: '360' } },
  orbitReverse: { duration: 2500, easing: 'Linear', properties: { rotateY: '-360' } },
  shockwave:  { duration: 800, easing: 'EaseOut', properties: { scaleX: '4', scaleY: '4', scaleZ: '4', opacity: '0' } },
  haloPulse:  [
    { duration: 1200, easing: 'EaseInEaseOut', properties: { scaleX: '1.05', scaleY: '1.05', scaleZ: '1.05', opacity: '0.15' } },
    { duration: 1200, easing: 'EaseInEaseOut', properties: { scaleX: '0.95', scaleY: '0.95', scaleZ: '0.95', opacity: '0.05' } },
  ],
});

export interface ARSceneProps {
  drops: Drop[];
  userLat: number;
  userLng: number;
  compassHeading: number;
  onDropTap: (drop: Drop) => void;
  onEnterRange: (drop: Drop) => void;
}

interface SceneNav { viroAppProps: ARSceneProps; }

function SolARScene(props: Record<string, unknown>): React.JSX.Element {
  const { drops, userLat, userLng, compassHeading, onDropTap, onEnterRange } =
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
          onEnterRange={onEnterRange}
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
