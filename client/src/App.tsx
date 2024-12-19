import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { apolloClient } from './lib/apollo';
import { AuthProvider } from './lib/AuthContext';
import { AppRoutes } from './AppRoutes';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;