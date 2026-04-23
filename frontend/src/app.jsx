import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/useAuthStore';

import Login        from './pages/Login';
import Registro     from './pages/Registro';
import Inicio       from './pages/Inicio';
import Menu         from './pages/Menu';
import PlatoDetalle from './pages/PlatoDetalle';
import Carrito      from './pages/Carrito';
import MapaMesas    from './pages/MapaMesas';
import MisPedidos   from './pages/MisPedidos';
import Pago         from './pages/Pago';
import Reservas     from './pages/Reservas';
import BottomNav    from './components/Layout/BottomNav';

function RutaProtegida({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function LayoutCliente({ children }) {
  return (
    <div style={{ paddingBottom: '72px', minHeight: '100dvh' }}>
      {children}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          borderRadius: '12px',
          background: '#1a1a1a',
          color: '#fff',
        }
      }} />
      <Routes>
        {/* Públicas */}
        <Route path="/login"    element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Protegidas */}
        <Route path="/" element={
          <RutaProtegida>
            <LayoutCliente><Inicio /></LayoutCliente>
          </RutaProtegida>
        } />
        <Route path="/menu" element={
          <RutaProtegida>
            <LayoutCliente><Menu /></LayoutCliente>
          </RutaProtegida>
        } />
        <Route path="/menu/plato/:id" element={
          <RutaProtegida>
            <LayoutCliente><PlatoDetalle /></LayoutCliente>
          </RutaProtegida>
        } />
        <Route path="/carrito" element={
          <RutaProtegida>
            <LayoutCliente><Carrito /></LayoutCliente>
          </RutaProtegida>
        } />
        <Route path="/mesas" element={
          <RutaProtegida>
            <LayoutCliente><MapaMesas /></LayoutCliente>
          </RutaProtegida>
        } />
        <Route path="/pedidos" element={
          <RutaProtegida>
            <LayoutCliente><MisPedidos /></LayoutCliente>
          </RutaProtegida>
        } />
        <Route path="/pago" element={
          <RutaProtegida>
            <LayoutCliente><Pago /></LayoutCliente>
          </RutaProtegida>
        } />
        <Route path="/reservas" element={
          <RutaProtegida>
            <LayoutCliente><Reservas /></LayoutCliente>
          </RutaProtegida>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}