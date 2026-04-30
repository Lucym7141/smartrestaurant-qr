import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registro } from '../api/auth';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff, User, Mail, Lock, Phone, Calendar } from 'lucide-react';

export default function Registro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verPass, setVerPass] = useState(false);
  const [form, setForm] = useState({
    nombre:           '',
    correo:           '',
    password:         '',
    telefono:         '',
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
        nombre:           form.nombre,
        correo:           form.correo,
        password:         form.password,
        telefono:         form.telefono || undefined,
        fecha_nacimiento: form.fecha_nacimiento || undefined,
      });
      toast.success('¡Cuenta creada! Inicia sesión 🎉');
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      if (data?.correo) toast.error('Este correo ya está registrado');
      else              toast.error('Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const campos = [
    { key: 'nombre',           label: 'Nombre completo',       type: 'text',     icon: User,     placeholder: 'Tu nombre completo',   required: true  },
    { key: 'correo',           label: 'Correo electrónico',    type: 'email',    icon: Mail,     placeholder: 'tu@correo.com',        required: true  },
    { key: 'telefono',         label: 'Teléfono',              type: 'tel',      icon: Phone,    placeholder: '+57 300 000 0000',     required: false },
    { key: 'fecha_nacimiento', label: 'Fecha de nacimiento',   type: 'date',     icon: Calendar, placeholder: '',                     required: false },
  ];

  const fuerzaPass = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2 : 3;

  const fuerzaColor  = ['#e5e0d8', '#e74c3c', '#f39c12', '#27ae60'];
  const fuerzaLabel  = ['', 'Débil', 'Regular', 'Fuerte'];

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      {/* Panel izquierdo — imagen (solo desktop) */}
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
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            color: '#fff', lineHeight: 1.1,
            marginBottom: '16px', letterSpacing: '-1px',
          }}>
            Únete y disfruta<br />una experiencia<br />
            <span style={{ color: '#ff4f1f' }}>gastronómica</span> única.
          </h1>
          <p style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Crea tu cuenta y empieza a pedir<br />directamente desde tu mesa.
          </p>
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
        overflowY: 'auto',
      }}>
        {/* Volver */}
        <button onClick={() => navigate('/login')} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#aaa', fontSize: '0.8rem', fontWeight: 600,
          marginBottom: '28px', padding: 0,
        }}>
          <ArrowLeft size={15} /> Volver al login
        </button>

        {/* Logo */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '1.8rem', color: '#1a1a1a', letterSpacing: '-1px',
          }}>
            Restaurant<span style={{ color: '#ff4f1f' }}>.</span>
          </h2>
          <p style={{ color: '#888', fontSize: '0.82rem', marginTop: '4px' }}>
            Sistema de gestión en línea
          </p>
        </div>

        <h3 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: '1.4rem', color: '#1a1a1a', marginBottom: '6px',
        }}>
          Crear cuenta
        </h3>
        <p style={{ color: '#aaa', fontSize: '0.82rem', marginBottom: '28px' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#ff4f1f', fontWeight: 700, textDecoration: 'none' }}>
            Inicia sesión
          </Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Campos dinámicos */}
          {campos.map(({ key, label, type, icon: Icon, placeholder, required }) => (
            <div key={key}>
              <label style={{
                display: 'block', fontSize: '0.78rem', fontWeight: 600,
                color: '#555', marginBottom: '8px',
              }}>
                {label}{!required && <span style={{ color: '#ccc', marginLeft: '6px', fontSize: '0.7rem' }}>opcional</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '13px', top: '50%',
                  transform: 'translateY(-50%)', color: '#ccc',
                  display: 'flex', alignItems: 'center',
                }}>
                  <Icon size={15} />
                </span>
                <input
                  required={required}
                  type={type}
                  value={form[key]}
                  placeholder={placeholder}
                  onChange={(e) => set(key, e.target.value)}
                  style={{
                    width: '100%', padding: '13px 14px 13px 38px',
                    border: '1.5px solid #e5e0d8', borderRadius: '10px',
                    fontSize: '0.88rem', fontFamily: 'Plus Jakarta Sans, sans-serif',
                    background: '#fafaf9', outline: 'none', color: '#1a1a1a',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#ff4f1f'}
                  onBlur={e => e.target.style.borderColor = '#e5e0d8'}
                />
              </div>
            </div>
          ))}

          {/* Contraseña */}
          <div>
            <label style={{
              display: 'block', fontSize: '0.78rem', fontWeight: 600,
              color: '#555', marginBottom: '8px',
            }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '13px', top: '50%',
                transform: 'translateY(-50%)', color: '#ccc',
                display: 'flex', alignItems: 'center',
              }}>
                <Lock size={15} />
              </span>
              <input
                required
                type={verPass ? 'text' : 'password'}
                value={form.password}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                onChange={(e) => set('password', e.target.value)}
                style={{
                  width: '100%', padding: '13px 44px 13px 38px',
                  border: '1.5px solid #e5e0d8', borderRadius: '10px',
                  fontSize: '0.88rem', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: '#fafaf9', outline: 'none', color: '#1a1a1a',
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#ff4f1f'}
                onBlur={e => e.target.style.borderColor = '#e5e0d8'}
              />
              <button type="button" onClick={() => setVerPass(!verPass)} style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#ccc', display: 'flex',
              }}>
                {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Barra de fuerza */}
            {form.password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1, 2, 3].map((n) => (
                    <div key={n} style={{
                      flex: 1, height: '3px', borderRadius: '99px',
                      background: fuerzaPass >= n ? fuerzaColor[fuerzaPass] : '#e5e0d8',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.7rem', color: fuerzaColor[fuerzaPass], fontWeight: 600 }}>
                  {fuerzaLabel[fuerzaPass]}
                </span>
              </div>
            )}
          </div>

          {/* Términos */}
          <p style={{ fontSize: '0.72rem', color: '#ccc', lineHeight: 1.6 }}>
            Al registrarte aceptas que tus datos serán usados únicamente
            para gestionar tu experiencia en el restaurante.
          </p>

          {/* Botón */}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '15px',
            background: loading ? '#ccc' : '#1a1a1a',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '0.9rem', fontWeight: 700,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#ff4f1f'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1a1a1a'; }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px',
          fontSize: '0.72rem', color: '#ccc' }}>
          mesa. · Tu experiencia gastronómica
        </p>
      </div>
    </div>
  );
}