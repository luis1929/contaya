import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Facturas from './pages/Facturas';
import Upload from './pages/Upload';
import Declarations from './pages/Declarations';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Clients from './pages/Clients';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/facturas" element={<Facturas />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/declarations" element={<Declarations />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/clientes" element={<Clients />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
