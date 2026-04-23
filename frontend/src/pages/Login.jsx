import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

export default function Login() {
  const [form, setForm]       = useState({ correo: '', password: '' });
  const [loading, setLoading] = useState(false);
  const setAuth               = useAuthStore((s) => s.setAuth);
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login({ username: form.correo, password: form.password });
      localStorage.setItem('access_token',  data.access);
      localStorage.setItem('refresh_token', data.refresh);
      const decoded = jwtDecode(data.access);
      setAuth(decoded.nombre, data.access, decoded.rol);
      toast.success(`¡Bienvenido, ${decoded.nombre}!`);
      navigate('/');
    } catch {
      toast.error('Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: 'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200)',
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

      <div style={{
        position: 'relative', zIndex: 1,
        background: '#fff', borderRadius: '24px',
        width: '90%', maxWidth: '420px',
        overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          background: '#1a1a1a', padding: '32px 32px 24px',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem',
            color: '#fff', letterSpacing: '-1px',
          }}>
            Restaurant<span style={{ color: '#ff4f1f' }}>.</span>
          </h1>
          <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
            Sistema de gestión en línea.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700,
              letterSpacing: '1.5px', color: '#1a1a1a', marginBottom: '8px' }}>
              CORREO
            </label>
            <input
              type="email" required
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
              placeholder="tu@correo.com"
              style={{
                width: '100%', padding: '14px 16px',
                border: '1.5px solid #e5e0d8', borderRadius: '12px',
                fontSize: '0.95rem', fontFamily: 'Plus Jakarta Sans, sans-serif',
                background: '#f5f2ed', outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700,
              letterSpacing: '1.5px', color: '#1a1a1a', marginBottom: '8px' }}>
              CONTRASEÑA
            </label>
            <input
              type="password" required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '14px 16px',
                border: '1.5px solid #e5e0d8', borderRadius: '12px',
                fontSize: '0.95rem', fontFamily: 'Plus Jakarta Sans, sans-serif',
                background: '#f5f2ed', outline: 'none',
              }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '16px',
            background: loading ? '#ccc' : '#ff4f1f',
            color: '#fff', border: 'none', borderRadius: '12px',
            fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s, transform 0.1s',
          }}>
            {loading ? 'INGRESANDO...' : 'INGRESAR'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: '#888' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" style={{ color: '#ff4f1f', fontWeight: 600, textDecoration: 'none' }}>
              Regístrate
            </Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.75rem', color: '#aaa' }}>
            mesa. · Tu experiencia gastronómica
          </p>
        </form>
      </div>
    </div>
  );
}