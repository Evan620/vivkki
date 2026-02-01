import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Archives from './pages/Archives';
import Intake from './pages/Intake';
import CaseDetail from './pages/CaseDetail';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import MedicalProviders from './pages/MedicalProviders';
import MedicalProviderDetail from './pages/MedicalProviderDetail';
import AutoInsurance from './pages/AutoInsurance';
import AutoInsuranceDetail from './pages/AutoInsuranceDetail';
import HealthInsurance from './pages/HealthInsurance';
import HealthInsuranceDetail from './pages/HealthInsuranceDetail';
import HealthAdjusters from './pages/HealthAdjusters';
import HealthAdjusterDetail from './pages/HealthAdjusterDetail';
import AutoAdjusters from './pages/AutoAdjusters';
import AutoAdjusterDetail from './pages/AutoAdjusterDetail';
import ApiKeys from './pages/ApiKeys';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { initDatabase } from './utils/database';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeSOUScheduler } from './utils/souScheduler';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return session ? children : <Navigate to="/" replace />;
}

function App() {
  useEffect(() => {
    initDatabase();
    
    // Initialize SOU scheduler for weekly automatic generation
    const cleanup = initializeSOUScheduler();
    
    return () => {
      cleanup();
    };
  }, []);

  return (
    <ErrorBoundary componentName="App">
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary componentName="Router">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route
                path="/welcome"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="Welcome">
                      <Welcome />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api-keys"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="ApiKeys">
                      <ApiKeys />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medical-providers"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="MedicalProviders">
                      <MedicalProviders />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medical-providers/:id"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="MedicalProviderDetail">
                      <MedicalProviderDetail />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auto-insurance"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="AutoInsurance">
                      <AutoInsurance />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auto-insurance/:id"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="AutoInsuranceDetail">
                      <AutoInsuranceDetail />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/health-insurance"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="HealthInsurance">
                      <HealthInsurance />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/health-insurance/:id"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="HealthInsuranceDetail">
                      <HealthInsuranceDetail />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/health-adjusters"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="HealthAdjusters">
                      <HealthAdjusters />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/health-adjusters/:id"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="HealthAdjusterDetail">
                      <HealthAdjusterDetail />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auto-adjusters"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="AutoAdjusters">
                      <AutoAdjusters />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auto-adjusters/:id"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="AutoAdjusterDetail">
                      <AutoAdjusterDetail />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="Home">
                      <Home />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="Dashboard">
                      <Dashboard />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/archives"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="Archives">
                      <Archives />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              {/* Analytics route removed per requirements */}
              <Route
                path="/intake"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="Intake">
                      <Intake />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/case/:id"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary componentName="CaseDetail">
                      <CaseDetail />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;