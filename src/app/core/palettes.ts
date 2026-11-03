/**
 * Pigment palettes. Every palette has exactly SLOT_COUNT colours.
 *
 * Painted regions store a *slot index* (0-5), never a hex value, so switching
 * palette ("shuffle mood") repaints everything the visitor has already filled.
 */
export interface PaletteColor {
  name: string;
  hex: string;
}

export interface Palette {
  name: string;
  colors: readonly PaletteColor[];
}

export const SLOT_COUNT = 6;

export const PALETTES: readonly Palette[] = [
  {
    name: 'Gouache Sunset',
    colors: [
      { name: 'Vermilion', hex: '#E4572E' },
      { name: 'Saffron', hex: '#F3A712' },
      { name: 'Midnight', hex: '#29335C' },
      { name: 'Steel Blue', hex: '#669BBC' },
      { name: 'Sage', hex: '#A8C686' },
      { name: 'Dusty Rose', hex: '#D88C9A' },
    ],
  },
  {
    name: 'Riso Print',
    colors: [
      { name: 'Fluoro Pink', hex: '#FF48B0' },
      { name: 'Riso Blue', hex: '#0078BF' },
      { name: 'Riso Yellow', hex: '#FFE800' },
      { name: 'Riso Green', hex: '#00A95C' },
      { name: 'Riso Orange', hex: '#FF6C2F' },
      { name: 'Violet', hex: '#765BA7' },
    ],
  },
  {
    name: 'Matisse Cut-outs',
    colors: [
      { name: 'Ultramarine', hex: '#1D3A8A' },
      { name: 'Poppy', hex: '#E63946' },
      { name: 'Apricot', hex: '#F4A261' },
      { name: 'Teal', hex: '#2A9D8F' },
      { name: 'Lemon', hex: '#F1C40F' },
      { name: 'Plum', hex: '#8E5572' },
    ],
  },
  {
    name: 'Deep Ocean',
    colors: [
      { name: 'Abyss', hex: '#03045E' },
      { name: 'Marine', hex: '#0077B6' },
      { name: 'Lagoon', hex: '#00B4D8' },
      { name: 'Sea Foam', hex: '#90E0EF' },
      { name: 'Coral', hex: '#F07167' },
      { name: 'Sand', hex: '#FED9B7' },
    ],
  },
  {
    name: 'Citrus Grove',
    colors: [
      { name: 'Blood Orange', hex: '#F94144' },
      { name: 'Tangerine', hex: '#F8961E' },
      { name: 'Lemon Zest', hex: '#F9C74F' },
      { name: 'Lime', hex: '#90BE6D' },
      { name: 'Mint', hex: '#43AA8B' },
      { name: 'Sky', hex: '#277DA1' },
    ],
  },
  {
    name: 'Forest Floor',
    colors: [
      { name: 'Pine', hex: '#344E41' },
      { name: 'Moss', hex: '#588157' },
      { name: 'Lichen', hex: '#A3B18A' },
      { name: 'Ochre', hex: '#DDA15E' },
      { name: 'Rust', hex: '#BC6C25' },
      { name: 'Heather', hex: '#6D597A' },
    ],
  },
];

/** Paper / ink pairs for the two themes. Mirrored as CSS vars by PaintState. */
export const THEMES = {
  paper: { paper: '#F6F2E9', paper2: '#ECE6D8', ink: '#161513', muted: '#6B665C' },
  chalk: { paper: '#141412', paper2: '#1E1D1A', ink: '#ECE8DF', muted: '#A39E92' },
} as const;
