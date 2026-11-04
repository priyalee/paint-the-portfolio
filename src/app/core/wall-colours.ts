import { Injectable, signal } from '@angular/core';
import { PaletteColor } from '@core/palettes';

/**
 * The wall's paint shelf: bright, saturated colours, because a wall full of
 * visitors looks best loud and varied.
 * Wall marks store their exact hex, so any colour here (or a custom one) is fine.
 */
export const WALL_COLOURS: readonly PaletteColor[] = [
  { name: 'Cherry', hex: '#FF1744' },
  { name: 'Scarlet', hex: '#FF3D00' },
  { name: 'Coral', hex: '#FF5E5B' },
  { name: 'Hot Pink', hex: '#FF2E93' },
  { name: 'Magenta', hex: '#F72585' },
  { name: 'Bubblegum', hex: '#FF6EC7' },
  { name: 'Tangerine', hex: '#FF7B00' },
  { name: 'Mango', hex: '#FF9E00' },
  { name: 'Sunflower', hex: '#FFC300' },
  { name: 'Lemon', hex: '#FFEA00' },
  { name: 'Neon Lime', hex: '#AEEA00' },
  { name: 'Spring Green', hex: '#00E676' },
  { name: 'Emerald', hex: '#00C853' },
  { name: 'Jade', hex: '#00BFA5' },
  { name: 'Turquoise', hex: '#00E5FF' },
  { name: 'Electric Blue', hex: '#00B0FF' },
  { name: 'Azure', hex: '#2979FF' },
  { name: 'Cobalt', hex: '#3D5AFE' },
  { name: 'Indigo', hex: '#651FFF' },
  { name: 'Electric Purple', hex: '#AA00FF' },
  { name: 'Grape', hex: '#7B2CBF' },
  { name: 'Lavender', hex: '#B388FF' },
  { name: 'Snow White', hex: '#FFFFFF' },
  { name: 'Jet Black', hex: '#111111' },
];

/**
 * The colour a visitor paints the wall with. The wall has its own bright
 * palette (the dock's palettes are softer), and each visit starts on a
 * random bright colour.
 */
@Injectable({ providedIn: 'root' })
export class WallColour {
  private readonly picked = signal<PaletteColor>(
    WALL_COLOURS[Math.floor(Math.random() * (WALL_COLOURS.length - 2))],
  );

  readonly colour = this.picked.asReadonly();

  pick(colour: PaletteColor): void {
    this.picked.set(colour);
  }

  pickCustom(hex: string): void {
    if (/^#[0-9a-f]{6}$/i.test(hex))
      this.picked.set({ name: 'Custom colour', hex: hex.toUpperCase() });
  }
}
