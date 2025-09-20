import React from "react";

type Props = { children: React.ReactNode };

export class DevErrorBoundary extends React.Component<Props, {error?: Error, info?: React.ErrorInfo}> {
  state = { error: undefined as Error | undefined, info: undefined as React.ErrorInfo | undefined };

  static getDerivedStateFromError(error: Error) { return { error }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // детальный лог в консоль
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] error:", error, "\ncomponentStack:", info?.componentStack);
    this.setState({ error, info });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background text-foreground p-6">
          <h1 className="text-xl font-semibold mb-3">Произошла ошибка</h1>
          <pre className="text-sm whitespace-pre-wrap opacity-90">{String(this.state.error.stack || this.state.error)}</pre>
          {this.state.info?.componentStack && (
            <details className="mt-3">
              <summary className="cursor-pointer">Компонентный стек</summary>
              <pre className="text-xs whitespace-pre-wrap opacity-70">{this.state.info.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
