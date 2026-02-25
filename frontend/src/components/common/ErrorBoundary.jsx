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

  componentDidUpdate(prevProps) {
    if (this.state.hasError && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    if (typeof this.props.onRetry === 'function') {
      this.props.onRetry();
      return;
    }

    if (this.props.variant === 'page') {
      window.location.reload();
      return;
    }

    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const {
      variant = 'page',
      title,
      description,
      retryLabel,
      className = '',
    } = this.props;

    if (variant === 'section') {
      return (
        <div className={`rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5 ${className}`}>
          <h3 className="text-sm sm:text-base font-bold text-red-700 mb-1">
            {title || '섹션을 불러오는 중 오류가 발생했습니다.'}
          </h3>
          <p className="text-xs sm:text-sm text-red-600">
            {description || '잠시 후 다시 시도해 주세요.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-3 px-3.5 py-2 rounded-lg bg-red-600 text-white text-xs sm:text-sm font-semibold hover:bg-red-700 transition"
          >
            {retryLabel || '다시 시도'}
          </button>

          {isDev && this.state.error?.message ? (
            <pre className="mt-4 p-3 bg-red-100 rounded-lg text-xs text-red-700 overflow-auto">
              {this.state.error.message}
            </pre>
          ) : null}
        </div>
      );
    }

    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-6 ${className}`}>
        <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {title || 'Something went wrong.'}
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            {description || 'An unexpected error occurred while rendering this page.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            {retryLabel || 'Reload page'}
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
