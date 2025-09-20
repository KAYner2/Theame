import React from "react";

export function SectionBoundary({
  name,
  children,
}: { name: string; children: React.ReactNode }) {
  return <Inner name={name}>{children}</Inner>;
}

class Inner extends React.Component<{name: string; children: React.ReactNode}, {error?: Error}> {
  state = { error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    // Точный маркер в консоли
    console.error(`[SectionBoundary:${this.props.name}]`, error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <div className="font-semibold mb-1">Блок «{this.props.name}» упал</div>
          <div className="opacity-80">{String(this.state.error.message)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}
