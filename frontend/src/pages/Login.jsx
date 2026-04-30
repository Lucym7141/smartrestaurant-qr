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
      const { data } = await login({ correo: form.correo, password: form.password });
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
      minHeight: '100dvh',
      display: 'flex',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      {/* Panel izquierdo — imagen */}
      <div style={{
        flex: 1,
        backgroundImage: 'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '48px',
        minHeight: '260px',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            color: '#fff',
            lineHeight: 1.1,
            marginBottom: '16px',
            letterSpacing: '-1px',
          }}>
            Reserve now your<br />table and enjoy an<br />
            <span style={{ color: '#ff4f1f' }}>unforgettable</span> experience.
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { days: 'Lun – Vie', hours: '10:00 AM – 10:00 PM' },
              { days: 'Sáb – Dom', hours: '09:00 AM – 11:00 PM' },
            ].map(({ days, hours }) => (
              <div key={days} style={{ display: 'flex', gap: '16px' }}>
                <span style={{ color: '#aaa', fontSize: '0.8rem', minWidth: '70px' }}>{days}</span>
                <span style={{ color: '#fff', fontSize: '0.8rem' }}>{hours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 40px',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.8rem',
            color: '#1a1a1a',
            letterSpacing: '-1px',
          }}>
            Restaurant<span style={{ color: '#ff4f1f' }}>.</span>
          </h2>
          <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
            Sistema de gestión en línea
          </p>
        </div>

        <h3 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '1.5rem',
          color: '#1a1a1a',
          marginBottom: '8px',
        }}>
          Good Morning! 👋
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '32px' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" style={{ color: '#ff4f1f', fontWeight: 700, textDecoration: 'none' }}>
            Regístrate
          </Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Correo */}
          <div>
            <label style={{
              display: 'block', fontSize: '0.8rem', fontWeight: 600,
              color: '#555', marginBottom: '8px',
            }}>
              Correo electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', fontSize: '1rem', color: '#aaa',
              }}>✉</span>
              <input
                type="email"
                required
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                placeholder="tu@correo.com"
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 38px',
                  border: '1.5px solid #e5e0d8',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  background: '#fafaf9',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#ff4f1f'}
                onBlur={e => e.target.style.borderColor = '#e5e0d8'}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label style={{
              display: 'block', fontSize: '0.8rem', fontWeight: 600,
              color: '#555', marginBottom: '8px',
            }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', fontSize: '1rem', color: '#aaa',
              }}>🔒</span>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 38px',
                  border: '1.5px solid #e5e0d8',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  background: '#fafaf9',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#ff4f1f'}
                onBlur={e => e.target.style.borderColor = '#e5e0d8'}
              />
            </div>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              background: loading ? '#ccc' : '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              marginTop: '8px',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#ff4f1f'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1a1a1a'; }}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión →'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', marginTop: '32px',
          fontSize: '0.75rem', color: '#bbb',
        }}>
          mesa. · Tu experiencia gastronómica
        </p>
      </div>
    </div>
  );
}