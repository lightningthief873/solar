/**
 * @format
 * Polyfills must be first — Solana SDK needs crypto.getRandomValues and Buffer.
 */
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
