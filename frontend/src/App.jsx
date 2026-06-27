import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminBillers from './pages/admin/Billers';
import AuditLog from './pages/admin/AuditLog';
import AdminSettings from './pages/admin/Settings';

import BillerLayout from './components/layout/BillerLayout';
import BillerDashboard from './pages/biller/Dashboard';
import BillerFacturas from './pages/biller/Facturas';
import BillerClients from './pages/biller/Clients';
import BillerUpload from './pages/biller/Upload';
import BillerDeclarations from './pages/biller/Declarations';

import CompanyPage from './pages/CompanyPage';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="billers" element={<AdminBillers />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="/" element={<BillerLayout />}>
          <Route path="dashboard" element={<BillerDashboard />} />
          <Route path="facturas" element={<BillerFacturas />} />
          <Route path="clientes" element={<BillerClients />} />
          <Route path="upload" element={<BillerUpload />} />
          <Route path="declarations" element={<BillerDeclarations />} />
          <Route path="company" element={<CompanyPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
