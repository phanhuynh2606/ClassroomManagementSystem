import React from 'react';
import { Alert, Button, Card, Typography, Result } from 'antd';
import { ReloadOutlined, BugOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

class AnalyticsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Analytics Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: `Analytics Error: ${error.message}`,
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const maxRetries = 3;
      const hasRetriedTooMuch = this.state.retryCount >= maxRetries;

      return (
        <div className="analytics-error-boundary p-6">
          <Card className="mx-auto max-w-4xl">
            <Result
              status="error"
              icon={<BugOutlined style={{ color: '#ff4d4f' }} />}
              title="Analytics Rendering Error"
              subTitle="Something went wrong while displaying the analytics charts and data."
            />
            
            {/* Error Details */}
            <div className="mb-6">
              <Alert
                message="Error Information"
                description={
                  <div className="text-left space-y-2">
                    <div>
                      <Text strong>Error:</Text> 
                      <Text code className="ml-2">
                        {this.state.error?.message || 'Unknown error occurred'}
                      </Text>
                    </div>
                    
                    <div>
                      <Text strong>Component:</Text> 
                      <Text className="ml-2">Assignment Analytics</Text>
                    </div>
                    
                    <div>
                      <Text strong>Time:</Text> 
                      <Text className="ml-2">{new Date().toLocaleString()}</Text>
                    </div>

                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                          🔧 Technical Details (Dev Mode)
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                          <strong>Stack Trace:</strong>
                          {this.state.error?.stack}
                          
                          <strong className="block mt-2">Component Stack:</strong>
                          {this.state.errorInfo?.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                }
                type="error"
                className="text-left mb-4"
                showIcon
              />
            </div>

            {/* Action Buttons */}
            <div className="text-center mb-6">
              <div className="space-x-3">
                {!hasRetriedTooMuch ? (
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />}
                    onClick={this.handleRetry}
                    size="large"
                  >
                    Try Again ({this.state.retryCount}/{maxRetries})
                  </Button>
                ) : (
                  <Button 
                    type="primary" 
                    danger
                    icon={<ReloadOutlined />}
                    onClick={this.handleReload}
                    size="large"
                  >
                    Reload Page
                  </Button>
                )}
                
                <Button 
                  icon={<QuestionCircleOutlined />}
                  onClick={() => {
                    const errorDetails = {
                      error: this.state.error?.message || 'Unknown error',
                      component: 'AssignmentAnalytics',
                      timestamp: new Date().toISOString(),
                      retries: this.state.retryCount
                    };
                    console.table(errorDetails);
                    alert('Error details logged to console. Press F12 to view.');
                  }}
                  size="large"
                >
                  Debug Info
                </Button>
              </div>
            </div>
            
            {/* Troubleshooting Tips */}
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <Title level={5} className="text-blue-700 mb-3">
                🔧 Troubleshooting Steps:
              </Title>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• <strong>Data Check:</strong> Ensure at least 3 submissions are graded</li>
                <li>• <strong>Browser:</strong> Clear cache and refresh the page</li>
                <li>• <strong>Network:</strong> Check your internet connection</li>
                <li>• <strong>Console:</strong> Open browser DevTools (F12) for more details</li>
                {hasRetriedTooMuch && (
                  <li>• <strong>Support:</strong> Contact technical support if error persists</li>
                )}
              </ul>
            </div>

            {/* Persistent Error Notice */}
            {hasRetriedTooMuch && (
              <Alert
                message="Persistent Error Detected"
                description="The error continues after multiple attempts. This may indicate a data corruption issue or a bug that requires technical support."
                type="warning"
                showIcon
                className="mt-4"
              />
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AnalyticsErrorBoundary;