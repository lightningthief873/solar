import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { WalletProvider } from './src/contexts/WalletContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App(): React.JSX.Element {
  return (
    <WalletProvider>
      <GestureHandlerRootView style={styles.root}>
        <AppNavigator />
      </GestureHandlerRootView>
    </WalletProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
