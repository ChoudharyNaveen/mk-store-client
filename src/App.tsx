import './globals.css';
import { AppProviders } from './components/AppProviders';
import { AppRouter } from './components/AppRouter';

/**
 * Main App component
 * Composes providers and router for the application
 */
function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}

export default App;
