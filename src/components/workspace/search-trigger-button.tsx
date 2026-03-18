'use client';

export function SearchTriggerButton() {
  return (
    <button
      className="hidden items-center gap-1.5 rounded-lg border border-border/60 bg-surface-muted/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground sm:flex"
      type="button"
      onClick={() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
      }}
    >
      <span>Search</span>
      <kbd className="rounded border border-border/40 bg-surface px-1 font-mono text-[10px]">⌘K</kbd>
    </button>
  );
}
