import React from 'react';

interface CustomErrorBoundaryProps {
  children: React.ReactNode;
}

interface CustomErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class CustomErrorBoundary extends React.Component<CustomErrorBoundaryProps, CustomErrorBoundaryState> {
  constructor(props: CustomErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      errorMessage: '' 
    };
  }

  static getDerivedStateFromError(error: any) {
    return { 
      hasError: true, 
      errorMessage: error?.message || 'Unknown error occurred' 
    };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-4">Something went wrong</h2>
          <p className="mb-4 text-red-600">{this.state.errorMessage || 'There was an error loading this component.'}</p>
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CustomErrorBoundary; 