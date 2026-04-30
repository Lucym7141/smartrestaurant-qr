import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getInicio, getMenu } from '../api/menu';
import useAuthStore from '../store/useAuthStore';
import { ChevronRight, Tag, Flame, ThumbsUp, LogOut, UtensilsCrossed, CalendarDays, ClipboardList, Map } from 'lucide-react';

const iconoTipo = {
  plato_del_dia:  { icon: Flame,     color: '#ff4f1f', label: 'Plato del día' },
  recomendacion:  { icon: ThumbsUp,  color: '#27ae60', label: 'Recomendado'   },
  promocion:      { icon: Tag,       color: '#f39c12', label: 'Promoción'     },
  descuento:      { icon: Tag,       color: '#e74c3c', label: 'Descuento'     },
};

function DestacadoCard({ item }) {
  const tipo = iconoTipo[item.tipo_nombre] || iconoTipo.recomendacion;
  const Icon = tipo.icon;

  return (
    <div style={{
      minWidth: '260px', borderRadius: '20px',
      background: '#1a1a1a', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      flexShrink: 0,
    }}>
      {item.plato_imagen ? (
        <div style={{ height: '150px', overflow: 'hidden' }}>
          <img src={item.plato_imagen} alt={item.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ height: '150px', background: '#2a2a2a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3rem' }}>🍽️</div>
      )}
      <div style={{ padding: '14px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          background: tipo.color + '22', borderRadius: '99px',
          padding: '3px 10px', marginBottom: '8px',
        }}>
          <Icon size={11} color={tipo.color} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: tipo.color, letterSpacing: '0.5px' }}>
            {tipo.label.toUpperCase()}
          </span>
        </div>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: '1rem', color: '#fff', marginBottom: '4px' }}>
          {item.titulo}
        </h3>
        {item.descripcion && (
          <p style={{ fontSize: '0.78rem', color: '#777', lineHeight: 1.5, marginBottom: '10px' }}>
            {item.descripcion}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {item.precio_promo && (
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '1.1rem', color: '#ff4f1f' }}>
              ${Number(item.precio_promo).toLocaleString()}
            </span>
          )}
          {item.descuento_pct && (
            <span style={{ background: '#ff4f1f', color: '#fff', borderRadius: '99px',
              fontSize: '10px', fontWeight: 700, padding: '2px 8px' }}>
              -{item.descuento_pct}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PlatoCard({ plato, navigate }) {
  return (
    <div
      onClick={() => navigate(`/menu/plato/${plato.id}`)}
      style={{
        minWidth: '150px', borderRadius: '16px', background: '#fff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
        transition: 'transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {plato.imagen_url ? (
        <img src={plato.imagen_url} alt={plato.nombre}
          style={{ width: '100%', height: '105px', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '105px', background: '#f5f2ed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🍽️</div>
      )}
      <div style={{ padding: '10px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1a1a1a',
          marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {plato.nombre}
        </p>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '0.9rem', color: '#ff4f1f' }}>
          ${Number(plato.precio_base).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function SeccionMenu({ categorias, navigate }) {
  return (
    <div style={{ padding: '0 20px 100px' }}>
      {categorias.map((cat) => (
        <div key={cat.id} style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1rem', color: '#1a1a1a' }}>
              {cat.nombre}
            </h2>
            <button onClick={() => navigate('/menu')} style={{
              display: 'flex', alignItems: 'center', gap: '2px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#ff4f1f', fontSize: '0.78rem', fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>
              Ver todo <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto',
            paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {cat.platos.slice(0, 5).map((plato) => (
              <PlatoCard key={plato.id} plato={plato} navigate={navigate} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Inicio() {
  const navigate = useNavigate();
  const usuario  = useAuthStore((s) => s.usuario);
  const logout   = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { data: destacados = [] } = useQuery({
    queryKey: ['inicio'],
    queryFn:  () => getInicio().then((r) => r.data),
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['menu'],
    queryFn:  () => getMenu().then((r) => r.data),
  });

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días ☀️' : hora < 19 ? 'Buenas tardes 👋' : 'Buenas noches 🌙';

  const acciones = [
    { label: 'Menú completo',  Icon: UtensilsCrossed, to: '/menu',     bg: '#1a1a1a', color: '#fff'    },
    { label: 'Reservar mesa',  Icon: CalendarDays,    to: '/reservas', bg: '#ff4f1f', color: '#fff'    },
    { label: 'Mis pedidos',    Icon: ClipboardList,   to: '/pedidos',  bg: '#fff',    color: '#1a1a1a' },
    { label: 'Mapa de mesas',  Icon: Map,             to: '/mesas',    bg: '#fff',    color: '#1a1a1a' },
  ];

  return (
    <div style={{ background: '#f5f2ed', minHeight: '100dvh', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a1a',
        padding: '52px 20px 32px',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Fondo decorativo */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(255,79,31,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <p style={{ color: '#666', fontSize: '0.82rem', marginBottom: '6px', letterSpacing: '0.3px' }}>
              {saludo}
            </p>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '1.8rem', color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1,
            }}>
              {usuario || 'Bienvenido'}
              <span style={{ color: '#ff4f1f' }}>.</span>
            </h1>
            <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '6px' }}>
              ¿Qué vas a pedir hoy?
            </p>
          </div>

          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '8px 12px', cursor: 'pointer',
            color: '#666', fontSize: '0.78rem', fontWeight: 600,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,79,31,0.15)'; e.currentTarget.style.color = '#ff4f1f'; e.currentTarget.style.borderColor = 'rgba(255,79,31,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>

        {/* Acciones rápidas dentro del header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '10px', marginTop: '24px',
        }}>
          {acciones.map(({ label, Icon, to, bg, color }) => (
            <button key={to} onClick={() => navigate(to)} style={{
              background: bg, color,
              border: 'none', borderRadius: '16px',
              padding: '16px 14px',
              cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: '10px',
              transition: 'transform 0.15s, opacity 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <div style={{
                background: color === '#fff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                borderRadius: '10px', padding: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Destacados */}
      {destacados.length > 0 && (
        <div style={{ padding: '24px 0 8px' }}>
          <div style={{ padding: '0 20px', marginBottom: '14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1rem', color: '#1a1a1a' }}>
              ✨ Destacados
            </h2>
            <div style={{ display: 'flex', gap: '4px' }}>
              {destacados.map((_, i) => (
                <div key={i} style={{
                  width: i === 0 ? '18px' : '5px', height: '5px',
                  borderRadius: '99px',
                  background: i === 0 ? '#ff4f1f' : '#ddd',
                }} />
              ))}
            </div>
          </div>
          <div style={{
            display: 'flex', gap: '14px', overflowX: 'auto',
            padding: '4px 20px 16px', scrollbarWidth: 'none',
          }}>
            {destacados.map((item) => (
              <DestacadoCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Menú por categorías */}
      {categorias.length > 0 && (
        <>
          <div style={{ padding: '8px 20px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1rem', color: '#1a1a1a' }}>
              🍽️ Nuestro menú
            </h2>
            <button onClick={() => navigate('/menu')} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#ff4f1f', fontSize: '0.78rem', fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>
              Ver todo <ChevronRight size={13} />
            </button>
          </div>
          <SeccionMenu categorias={categorias} navigate={navigate} />
        </>
      )}
    </div>
  );
}