import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

import MainLayout from './components/layout/MainLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminBillers from './pages/admin/Billers';
import AuditLog from './pages/admin/AuditLog';
import AdminSettings from './pages/admin/Settings';

import BillerDashboard from './pages/biller/Dashboard';
import BillerFacturas from './pages/biller/Facturas';
import BillerClients from './pages/biller/Clients';
import BillerUpload from './pages/biller/Upload';
import BillerDeclarations from './pages/biller/Declarations';
import BillerCredentials from './pages/biller/Credentials';
import BillerRutUpload from './pages/biller/RutUpload';
import BillerItems from './pages/biller/Items';
import BillerFacturacion from './pages/Facturas';

import CompanyPage from './pages/CompanyPage';

import ToastContainer from './components/ui/Toast';

import './App.css';

function App() {
  return (
    <>
    <ToastContainer />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<MainLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/billers" element={<AdminBillers />} />
          <Route path="/admin/audit-log" element={<AuditLog />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/facturas" element={<BillerFacturas />} />
          <Route path="/clientes" element={<BillerClients />} />
          <Route path="/upload" element={<BillerUpload />} />
          <Route path="/declarations" element={<BillerDeclarations />} />
          <Route path="/credentials" element={<BillerCredentials />} />
          <Route path="/rut-upload" element={<BillerRutUpload />} />
          <Route path="/items" element={<BillerItems />} />
          <Route path="/facturacion" element={<BillerFacturacion />} />
          <Route path="/company" element={<CompanyPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
