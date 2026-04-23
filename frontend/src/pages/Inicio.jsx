import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getInicio, getMenu } from '../api/menu';
import useAuthStore from '../store/useAuthStore';
import { ChevronRight, Star, Tag, Flame, ThumbsUp } from 'lucide-react';

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
      minWidth: '280px', borderRadius: '20px',
      background: '#1a1a1a', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      flexShrink: 0,
    }}>
      {item.plato_imagen && (
        <div style={{ height: '160px', overflow: 'hidden' }}>
          <img src={item.plato_imagen} alt={item.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: tipo.color + '22', borderRadius: '99px',
          padding: '4px 10px', marginBottom: '10px',
        }}>
          <Icon size={12} color={tipo.color} />
          <span style={{ fontSize: '11px', fontWeight: 700,
            color: tipo.color, letterSpacing: '0.5px' }}>
            {tipo.label.toUpperCase()}
          </span>
        </div>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: '1.1rem', color: '#fff', marginBottom: '6px' }}>
          {item.titulo}
        </h3>
        {item.descripcion && (
          <p style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.5,
            marginBottom: '10px' }}>
            {item.descripcion}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {item.precio_promo && (
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '1.2rem', color: '#ff4f1f' }}>
              ${Number(item.precio_promo).toLocaleString()}
            </span>
          )}
          {item.descuento_pct && (
            <span style={{
              background: '#ff4f1f', color: '#fff', borderRadius: '99px',
              fontSize: '11px', fontWeight: 700, padding: '3px 10px',
            }}>
              -{item.descuento_pct}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SeccionMenu({ categorias, navigate }) {
  return (
    <div style={{ padding: '0 20px 20px' }}>
      {categorias.map((cat) => (
        <div key={cat.id} style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1.1rem', color: '#1a1a1a' }}>
              {cat.nombre}
            </h2>
            <button onClick={() => navigate('/menu')} style={{
              display: 'flex', alignItems: 'center', gap: '2px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#ff4f1f', fontSize: '0.8rem', fontWeight: 600,
            }}>
              Ver todo <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto',
            paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {cat.platos.slice(0, 5).map((plato) => (
              <div key={plato.id} onClick={() => navigate(`/menu/plato/${plato.id}`)}
                style={{
                  minWidth: '160px', borderRadius: '16px', background: '#fff',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {plato.imagen_url ? (
                  <img src={plato.imagen_url} alt={plato.nombre}
                    style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '110px',
                    background: '#f5f2ed', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem' }}>🍽️</div>
                )}
                <div style={{ padding: '10px' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem',
                    color: '#1a1a1a', marginBottom: '4px',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis' }}>
                    {plato.nombre}
                  </p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: '0.95rem', color: '#ff4f1f' }}>
                    ${Number(plato.precio_base).toLocaleString()}
                  </p>
                </div>
              </div>
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

  const { data: destacados = [] } = useQuery({
    queryKey: ['inicio'],
    queryFn:  () => getInicio().then((r) => r.data),
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['menu'],
    queryFn:  () => getMenu().then((r) => r.data),
  });

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div style={{ background: '#f5f2ed', minHeight: '100dvh' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '48px 20px 28px',
        borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px',
      }}>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '4px' }}>
          {saludo} 👋
        </p>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '1.6rem', color: '#fff', letterSpacing: '-0.5px' }}>
          {usuario || 'Bienvenido'}
          <span style={{ color: '#ff4f1f' }}>.</span>
        </h1>
        <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '4px' }}>
          ¿Qué vas a pedir hoy?
        </p>
      </div>

      {/* Destacados */}
      {destacados.length > 0 && (
        <div style={{ padding: '24px 0 8px' }}>
          <div style={{ padding: '0 20px', marginBottom: '14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1.1rem', color: '#1a1a1a' }}>
              Destacados
            </h2>
            <div style={{ display: 'flex', gap: '4px' }}>
              {destacados.map((_, i) => (
                <div key={i} style={{
                  width: i === 0 ? '20px' : '6px', height: '6px',
                  borderRadius: '99px',
                  background: i === 0 ? '#ff4f1f' : '#e5e0d8',
                  transition: 'width 0.3s',
                }} />
              ))}
            </div>
          </div>
          <div style={{
            display: 'flex', gap: '16px', overflowX: 'auto',
            padding: '4px 20px 16px', scrollbarWidth: 'none',
          }}>
            {destacados.map((item) => (
              <DestacadoCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div style={{ padding: '8px 20px 24px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { label: 'Ver menú completo', emoji: '🍽️', to: '/menu',     bg: '#1a1a1a', color: '#fff'     },
          { label: 'Reservar una mesa', emoji: '📅', to: '/reservas', bg: '#ff4f1f', color: '#fff'     },
          { label: 'Mis pedidos',       emoji: '📋', to: '/pedidos',  bg: '#fff',     color: '#1a1a1a' },
          { label: 'Mapa de mesas',     emoji: '🗺️', to: '/mesas',   bg: '#fff',     color: '#1a1a1a' },
        ].map(({ label, emoji, to, bg, color }) => (
          <button key={to} onClick={() => navigate(to)} style={{
            background: bg, color, border: 'none', borderRadius: '16px',
            padding: '18px 16px', cursor: 'pointer', textAlign: 'left',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{emoji}</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem',
              fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Menú por categorías */}
      {categorias.length > 0 && (
        <SeccionMenu categorias={categorias} navigate={navigate} />
      )}
    </div>
  );
}