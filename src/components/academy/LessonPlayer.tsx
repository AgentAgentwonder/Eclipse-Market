export default function LessonPlayer({ onLaunch }: { onLaunch: () => void; walletAddress: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border/60 bg-muted/40 p-6">
      <h3 className="text-lg font-semibold">Jump into a lesson</h3>
      <p className="text-sm text-muted-foreground">Continue your learning journey with tailored content.</p>
      <button
        onClick={onLaunch}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
      >
        Resume learning
      </button>
    </div>
  );
}
