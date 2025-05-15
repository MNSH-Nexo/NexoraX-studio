import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-10 bg-red-100 rounded-xl">
          <h2 className="text-xl font-bold text-red-600">Something went wrong!</h2>
          <p className="mt-2 text-gray-600">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;