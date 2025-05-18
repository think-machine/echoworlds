import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Layouts
import MainLayout from './layouts/MainLayout';

// Import Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
// World Pages
import CreateWorldPage from './pages/CreateWorldPage';
import WorldDetailPage from './pages/WorldDetailPage';
import EditWorldPage from './pages/EditWorldPage';
// People Pages
import WorldPeoplePage from './pages/WorldPeoplePage';
import AddPersonPage from './pages/AddPersonPage';
import PersonDetailPage from './pages/PersonDetailPage';
import EditPersonPage from './pages/EditPersonPage';
// Location Pages
import WorldLocationsPage from './pages/WorldLocationsPage'; // New
import AddLocationPage from './pages/AddLocationPage';     // New
// Import LocationDetailPage and EditLocationPage later
import NotFoundPage from './pages/NotFoundPage';

// Import Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Routes with MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        
        {/* World specific routes */}
        <Route path="/worlds/create" element={<ProtectedRoute><CreateWorldPage /></ProtectedRoute>} />
        <Route path="/worlds/:worldId" element={<ProtectedRoute><WorldDetailPage /></ProtectedRoute>} />
        <Route path="/worlds/:worldId/edit" element={<ProtectedRoute><EditWorldPage /></ProtectedRoute>} />
        
        {/* People specific routes (nested under a world) */}
        <Route path="/worlds/:worldId/people" element={<ProtectedRoute><WorldPeoplePage /></ProtectedRoute>} />
        <Route path="/worlds/:worldId/people/add" element={<ProtectedRoute><AddPersonPage /></ProtectedRoute>} />
        <Route path="/worlds/:worldId/people/:personId" element={<ProtectedRoute><PersonDetailPage /></ProtectedRoute>} />
        <Route path="/worlds/:worldId/people/:personId/edit" element={<ProtectedRoute><EditPersonPage /></ProtectedRoute>} />

        {/* Location specific routes (nested under a world) */}
        <Route path="/worlds/:worldId/locations" element={<ProtectedRoute><WorldLocationsPage /></ProtectedRoute>} /> {/* New */}
        <Route path="/worlds/:worldId/locations/add" element={<ProtectedRoute><AddLocationPage /></ProtectedRoute>} /> {/* New */}
        {/* <Route path="/worlds/:worldId/locations/:locationId" element={<ProtectedRoute><LocationDetailPage /></ProtectedRoute>} /> */}
        {/* <Route path="/worlds/:worldId/locations/:locationId/edit" element={<ProtectedRoute><EditLocationPage /></ProtectedRoute>} /> */}


        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
