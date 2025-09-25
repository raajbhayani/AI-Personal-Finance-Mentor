import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/graphql/apollo-client';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider, NotificationContainer } from '@/contexts/NotificationContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PageErrorBoundary
      enableRetry={true}
      maxRetries={3}
      onError={(error, errorInfo, errorId) => {
        console.error('Application Error:', { error, errorInfo, errorId });
      }}
    >
      <AuthProvider>
        <NotificationProvider>
          <ApolloProvider client={apolloClient}>
            <Component {...pageProps} />
            <NotificationContainer />
          </ApolloProvider>
        </NotificationProvider>
      </AuthProvider>
    </PageErrorBoundary>
  );
}