import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import CodeEditor from './pages/CodeEditor';
import RoomsPage from './pages/RoomsPage';
import ErrorBoundary from './components/ErrorBoundary';
import { NotFoundPage } from './pages/ErrorPages';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/room/:roomId" element={<CodeEditor />} />
            {/* 404 Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
