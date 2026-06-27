import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Landing from './pages/Landing';
<<<<<<< HEAD
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
=======
import Dashboard from './pages/Dashboard';
import Facturas from './pages/Facturas';
import Upload from './pages/Upload';
import Declarations from './pages/Declarations';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Clients from './pages/Clients';
import CompanyPage from './pages/CompanyPage';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';
>>>>>>> 1d55fded9ff5433180cb1a5257998ca0df7ef5ec

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
<<<<<<< HEAD

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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
=======
        <Route path="/clientes" element={<Clients />} />
        <Route path="/company" element={<CompanyPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
>>>>>>> 1d55fded9ff5433180cb1a5257998ca0df7ef5ec
      </Routes>
    </BrowserRouter>
  );
}

export default App;
