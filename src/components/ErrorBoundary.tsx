import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-red-900/20 border border-red-500/50 rounded-xl max-w-2xl mx-auto z-50 relative">
          <h2 className="text-xl font-bold text-rose-400 mb-4">¡Oh no! Ha ocurrido un error en la interfaz.</h2>
          <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono bg-red-950/50 p-4 rounded-lg overflow-x-auto">
            {this.state.error?.toString()}
            {'\n'}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
