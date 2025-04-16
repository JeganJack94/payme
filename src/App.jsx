import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import { auth } from './services/firebase';
import { ExpenseForm } from './components/ExpenseForm';
import PWAInstallPrompt from "./components/PWAInstallPrompt";

const ProtectedRoute = ({ children, isSidebarOpen, setSidebarOpen, toggleSidebar }) => {
  const user = auth.currentUser;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
        <main className={`flex-1 p-6 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} md:ml-64 mt-16`}>
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let wasAuthenticated = false; // Track if the user was previously authenticated

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        wasAuthenticated = true; // User is authenticated
      } else if (wasAuthenticated) {
        // Only show the alert if the user was previously authenticated
        alert('Session expired. Please sign in again.');
        window.location.href = '/login';
      }
      setLoading(false); // Set loading to false after auth state is determined
    });

    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
    <PWAInstallPrompt />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={
          <ProtectedRoute 
            isSidebarOpen={isSidebarOpen} 
            setSidebarOpen={setSidebarOpen}
            toggleSidebar={toggleSidebar}
          >
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/sales" element={
          <ProtectedRoute 
            isSidebarOpen={isSidebarOpen} 
            setSidebarOpen={setSidebarOpen}
            toggleSidebar={toggleSidebar}
          >
            <Sales />
          </ProtectedRoute>
        } />
        <Route path="/purchases" element={
          <ProtectedRoute 
            isSidebarOpen={isSidebarOpen} 
            setSidebarOpen={setSidebarOpen}
            toggleSidebar={toggleSidebar}
          >
            <Purchases />
          </ProtectedRoute>
        } />
        <Route path="/expenses" element={
          <ProtectedRoute 
            isSidebarOpen={isSidebarOpen} 
            setSidebarOpen={setSidebarOpen}
            toggleSidebar={toggleSidebar}
          >
            <Expenses />
          </ProtectedRoute>
        } />
        <Route path="/expense-form" element={
          <ProtectedRoute 
            isSidebarOpen={isSidebarOpen} 
            setSidebarOpen={setSidebarOpen}
            toggleSidebar={toggleSidebar}
          >
            <ExpenseForm />
          </ProtectedRoute>
        } />
        <Route path="/expense-form/:id" element={
          <ProtectedRoute 
            isSidebarOpen={isSidebarOpen} 
            setSidebarOpen={setSidebarOpen}
            toggleSidebar={toggleSidebar}
          >
            <ExpenseForm />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute 
            isSidebarOpen={isSidebarOpen} 
            setSidebarOpen={setSidebarOpen}
            toggleSidebar={toggleSidebar}
          >
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute 
            isSidebarOpen={isSidebarOpen} 
            setSidebarOpen={setSidebarOpen}
            toggleSidebar={toggleSidebar}
          >
            <Settings />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
