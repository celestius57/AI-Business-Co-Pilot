import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-lg text-center border border-red-700/50">
                <h1 className="text-3xl font-bold text-red-400 mb-4">Oops! Something went wrong.</h1>
                <p className="text-slate-300 mb-6">
                    The application has encountered an unexpected error. Please try reloading the page.
                </p>
                {this.state.error && (
                    <details className="bg-slate-900/50 p-4 rounded-lg text-left text-xs text-slate-400 mb-6">
                        <summary className="cursor-pointer font-semibold mb-2">Error Details</summary>
                        <pre className="whitespace-pre-wrap font-mono">{this.state.error.stack}</pre>
                    </details>
                )}
                <button
                    onClick={() => window.location.reload()}
                    className="bg-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-indigo-500 transition-colors"
                >
                    Reload Page
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}
