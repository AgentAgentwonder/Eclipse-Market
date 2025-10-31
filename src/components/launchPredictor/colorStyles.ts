export type ColorTone = 'emerald' | 'amber' | 'orange' | 'red' | 'gray';

interface ColorStyle {
  text: string;
  chipBg: string;
  chipText: string;
  badgeBg: string;
  badgeBorder: string;
}

const COLOR_STYLES: Record<ColorTone, ColorStyle> = {
  emerald: {
    text: 'text-emerald-400',
    chipBg: 'bg-emerald-500/20',
    chipText: 'text-emerald-200',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
  },
  amber: {
    text: 'text-amber-400',
    chipBg: 'bg-amber-500/20',
    chipText: 'text-amber-200',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
  },
  orange: {
    text: 'text-orange-400',
    chipBg: 'bg-orange-500/20',
    chipText: 'text-orange-200',
    badgeBg: 'bg-orange-500/10',
    badgeBorder: 'border-orange-500/30',
  },
  red: {
    text: 'text-red-400',
    chipBg: 'bg-red-500/20',
    chipText: 'text-red-200',
    badgeBg: 'bg-red-500/10',
    badgeBorder: 'border-red-500/30',
  },
  gray: {
    text: 'text-slate-300',
    chipBg: 'bg-slate-500/10',
    chipText: 'text-slate-200',
    badgeBg: 'bg-slate-500/10',
    badgeBorder: 'border-slate-500/20',
  },
};

export const getColorStyle = (tone: string): ColorStyle => {
  if (tone in COLOR_STYLES) {
    return COLOR_STYLES[tone as ColorTone];
  }
  return COLOR_STYLES.gray;
};
