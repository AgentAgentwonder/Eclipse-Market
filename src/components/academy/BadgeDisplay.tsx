import React from 'react';
import { Award } from 'lucide-react';

export default function BadgeDisplay({ badge }: { badge: any }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Award className="h-5 w-5 text-amber-500" />
        <span className="font-semibold">{badge.name}</span>
      </div>
      <p className="text-xs text-muted-foreground">{badge.description}</p>
    </div>
  );
}
