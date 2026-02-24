import React from 'react';

const isDev = import.meta.env.DEV;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong.</h1>
          <p className="text-sm text-gray-600 mb-6">
            An unexpected error occurred while rendering this page.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Reload page
          </button>

          {isDev && this.state.error?.message ? (
            <pre className="mt-6 p-3 bg-gray-100 rounded-lg text-xs text-gray-700 overflow-auto">
              {this.state.error.message}
            </pre>
          ) : null}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
