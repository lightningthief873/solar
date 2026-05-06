import React from 'react';
import { StyleSheet } from 'react-native';
import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroAnimatedComponent,
  ViroAnimations,
  ViroMaterials,
  ViroSphere,
  ViroText,
} from '@reactvision/react-viro';

ViroMaterials.createMaterials({
  glowBlue: {
    diffuseColor: '#001F3F',
    emissiveColor: '#00BFFF',
  },
});

ViroAnimations.registerAnimations({
  rotateY: {
    duration: 3000,
    easing: 'Linear',
    properties: { rotateY: '360' },
  },
  floatUp: {
    duration: 1000,
    easing: 'EaseInEaseOut',
    properties: { translateY: '0.1' },
  },
  floatDown: {
    duration: 1000,
    easing: 'EaseInEaseOut',
    properties: { translateY: '-0.1' },
  },
  floatCycle: ['floatUp', 'floatDown'],
});

function SolARScene(): React.JSX.Element {
  return (
    <ViroARScene>
      <ViroAnimatedComponent
        animation={{ name: 'rotateY', run: true, loop: true }}
      >
        <ViroAnimatedComponent
          animation={{ name: 'floatCycle', run: true, loop: true }}
        >
          <ViroSphere
            position={[0, -0.5, -3]}
            radius={0.15}
            materials={['glowBlue']}
          />
        </ViroAnimatedComponent>
      </ViroAnimatedComponent>

      <ViroText
        text="SolAR"
        position={[0, -0.2, -3]}
        style={styles.arText}
        color="#00BFFF"
      />
    </ViroARScene>
  );
}

export function ARScene(): React.JSX.Element {
  return (
    <ViroARSceneNavigator
      autofocus
      initialScene={{ scene: SolARScene }}
      style={StyleSheet.absoluteFill}
    />
  );
}

const styles = StyleSheet.create({
  arText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
});
