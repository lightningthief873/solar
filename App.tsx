import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Linking, StyleSheet } from 'react-native';
import { WalletProvider } from './src/contexts/WalletContext';
import AppNavigator from './src/navigation/AppNavigator';
import { dispatchDeepLink } from './src/utils/deepLink';

function useLinking() {
  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url?.startsWith('solar://drop')) dispatchDeepLink(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url?.startsWith('solar://drop')) dispatchDeepLink(url);
    });
    return () => sub.remove();
  }, []);
}

export default function App(): React.JSX.Element {
  useLinking();
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
