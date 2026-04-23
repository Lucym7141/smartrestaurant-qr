import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registro } from '../api/auth';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const inputStyle = {
  width: '100%', padding: '13px 14px',
  border: '1.5px solid #e5e0d8', borderRadius: '12px',
  fontSize: '0.9rem', fontFamily: 'Plus Jakarta Sans, sans-serif',
  background: '#f5f2ed', outline: 'none', color: '#1a1a1a',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  letterSpacing: '1.2px', color: '#1a1a1a', marginBottom: '8px',
};

export default function Registro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verPass, setVerPass] = useState(false);
  const [form, setForm] = useState({
    nombre:          '',
    correo:          '',
    password:        '',
    telefono:        '',
    fecha_nacimiento: '',
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres'); return;
    }
    setLoading(true);
    try {
      await registro({
        nombre:          form.nombre,
        correo:          form.correo,
        password:        form.password,
        telefono:        form.telefono || undefined,
        fecha_nacimiento: form.fecha_nacimiento || undefined,
      });
      toast.success('¡Cuenta creada! Inicia sesión 🎉');
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      if (data?.correo)    toast.error('Este correo ya está registrado');
      else                 toast.error('Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh', background: '#f5f2ed',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '48px 20px 28px',
        borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px',
      }}>
        <button onClick={() => navigate('/login')} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none',
          borderRadius: '12px', padding: '10px', cursor: 'pointer',
          display: 'flex', marginBottom: '16px',
        }}>
          <ArrowLeft size={20} color="#fff" />
        </button>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '1.8rem', color: '#fff', letterSpacing: '-0.5px' }}>
          Crear cuenta<span style={{ color: '#ff4f1f' }}>.</span>
        </h1>
        <p style={{ color: '#888', fontSize: '0.82rem', marginTop: '4px' }}>
          Únete y empieza a pedir desde tu mesa
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}
        style={{ padding: '24px 20px', flex: 1,
          display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Nombre */}
        <div>
          <label style={labelStyle}>NOMBRE COMPLETO *</label>
          <input required value={form.nombre} placeholder="Tu nombre"
            onChange={(e) => set('nombre', e.target.value)} style={inputStyle} />
        </div>

        {/* Correo */}
        <div>
          <label style={labelStyle}>CORREO ELECTRÓNICO *</label>
          <input required type="email" value={form.correo} placeholder="tu@correo.com"
            onChange={(e) => set('correo', e.target.value)} style={inputStyle} />
        </div>

        {/* Contraseña */}
        <div>
          <label style={labelStyle}>CONTRASEÑA *</label>
          <div style={{ position: 'relative' }}>
            <input required type={verPass ? 'text' : 'password'}
              value={form.password} placeholder="Mínimo 8 caracteres"
              minLength={8}
              onChange={(e) => set('password', e.target.value)}
              style={{ ...inputStyle, paddingRight: '44px' }} />
            <button type="button" onClick={() => setVerPass(!verPass)} style={{
              position: 'absolute', right: '12px', top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', color: '#888',
            }}>
              {verPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Fuerza de contraseña */}
          {form.password && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} style={{
                  flex: 1, height: '3px', borderRadius: '99px',
                  background: form.password.length >= n * 4
                    ? n === 1 ? '#e74c3c' : n === 2 ? '#f39c12' : '#27ae60'
                    : '#e5e0d8',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Teléfono (opcional) */}
        <div>
          <label style={labelStyle}>TELÉFONO <span style={{ color: '#aaa',
            fontWeight: 400, fontSize: '10px' }}>OPCIONAL</span></label>
          <input type="tel" value={form.telefono} placeholder="+57 300 000 0000"
            onChange={(e) => set('telefono', e.target.value)} style={inputStyle} />
        </div>

        {/* Fecha de nacimiento (opcional) */}
        <div>
          <label style={labelStyle}>FECHA DE NACIMIENTO <span style={{ color: '#aaa',
            fontWeight: 400, fontSize: '10px' }}>OPCIONAL</span></label>
          <input type="date" value={form.fecha_nacimiento}
            onChange={(e) => set('fecha_nacimiento', e.target.value)}
            style={inputStyle} />
        </div>

        {/* Términos */}
        <p style={{ fontSize: '0.75rem', color: '#aaa',
          textAlign: 'center', lineHeight: 1.6 }}>
          Al registrarte aceptas que tus datos serán usados
          únicamente para gestionar tu experiencia en el restaurante.
        </p>

        {/* Submit */}
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '16px',
          background: loading ? '#ccc' : '#ff4f1f',
          color: '#fff', border: 'none', borderRadius: '13px',
          fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1.5px',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '4px',
        }}>
          {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#888' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#ff4f1f',
            fontWeight: 700, textDecoration: 'none' }}>
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}