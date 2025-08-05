import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">Error Details:</h3>
                <div className="bg-avoid-50 border border-avoid-200 rounded-lg p-4">
                  <pre className="text-sm text-avoid-800 whitespace-pre-wrap">
                    {this.state.error && this.state.error.toString()}
                  </pre>
                </div>
              </div>
              
              {this.state.errorInfo && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">Component Stack:</h3>
                  <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-4">
                    <pre className="text-sm text-neutral-700 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
