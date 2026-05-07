import type { ArtStyle } from '../types';

export const ART_STYLES: Record<ArtStyle, { label: string; emoji: string; colors: string[]; desc: string }> = {
  default: { label: 'Classic', emoji: '✨', colors: ['#1C1C2E', '#2C2C4E'], desc: 'Timeless dark' },
  cosmic:  { label: 'Cosmic',  emoji: '🌌', colors: ['#0D0D2B', '#1A0533', '#2E0854'], desc: 'Deep space nebula' },
  neon:    { label: 'Neon',    emoji: '⚡', colors: ['#001a00', '#003300', '#00FF88'], desc: 'Electric forest' },
  gold:    { label: 'Gold',    emoji: '👑', colors: ['#1A1200', '#3D2B00', '#FFD700'], desc: 'Royal treasure' },
  storm:   { label: 'Storm',   emoji: '🌩', colors: ['#0A0A1A', '#1A1A3A', '#4A00FF'], desc: 'Digital storm' },
  phoenix: { label: 'Phoenix', emoji: '🔥', colors: ['#1A0000', '#3D0000', '#FF4500'], desc: 'Phoenix fire' },
};
