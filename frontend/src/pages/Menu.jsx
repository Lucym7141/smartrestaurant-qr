import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getMenu } from '../api/menu';
import { Search, ShoppingBag } from 'lucide-react';
import useCarritoStore from '../store/useCarritoStore';

function PlatoCard({ plato, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      overflow: 'hidden', cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
      }}
    >
      <div style={{ position: 'relative', height: '140px' }}>
        {plato.imagen_url ? (
          <img src={plato.imagen_url} alt={plato.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f5f2ed',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '2.5rem' }}>🍽️</div>
        )}
        {plato.modelo_ar_url && (
          <div style={{
            position: 'absolute', top: '8px', right: '8px',
            background: 'rgba(26,26,26,0.75)', borderRadius: '8px',
            padding: '3px 8px', backdropFilter: 'blur(4px)',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700,
              color: '#ff4f1f', letterSpacing: '0.5px' }}>AR 3D</span>
          </div>
        )}
      </div>
      <div style={{ padding: '12px', flex: 1, display: 'flex',
        flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem',
            color: '#1a1a1a', marginBottom: '4px', lineHeight: 1.3 }}>
            {plato.nombre}
          </h3>
          {plato.descripcion && (
            <p style={{
              fontSize: '0.75rem', color: '#888', lineHeight: 1.4,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {plato.descripcion}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginTop: '10px' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '1.05rem', color: '#ff4f1f' }}>
            ${Number(plato.precio_base).toLocaleString()}
          </span>
          {plato.tiempo_prep_min && (
            <span style={{ fontSize: '11px', color: '#888',
              background: '#f5f2ed', borderRadius: '99px', padding: '3px 8px' }}>
              ⏱ {plato.tiempo_prep_min} min
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Menu() {
  const navigate   = useNavigate();
  const [busqueda, setBusqueda]   = useState('');
  const [catActiva, setCatActiva] = useState(null);
  const count = useCarritoStore((s) => s.count);

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['menu'],
    queryFn:  () => getMenu().then((r) => r.data),
  });

  const categoriasFiltradas = catActiva
    ? categorias.filter((c) => c.id === catActiva)
    : categorias;

  const platosConBusqueda = categoriasFiltradas.map((cat) => ({
    ...cat,
    platos: cat.platos.filter((p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    ),
  })).filter((cat) => cat.platos.length > 0);

  return (
    <div style={{ background: '#f5f2ed', minHeight: '100dvh' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '48px 20px 24px',
        borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '1.8rem', color: '#fff', letterSpacing: '-0.5px' }}>
              Menú<span style={{ color: '#ff4f1f' }}>.</span>
            </h1>
            <p style={{ color: '#888', fontSize: '0.8rem' }}>
              {categorias.reduce((a, c) => a + c.platos.length, 0)} platos disponibles
            </p>
          </div>
          <button onClick={() => navigate('/carrito')} style={{
            position: 'relative', background: '#ff4f1f',
            border: 'none', borderRadius: '12px', padding: '10px',
            cursor: 'pointer', display: 'flex',
          }}>
            <ShoppingBag size={22} color="#fff" />
            {count > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: '#fff', color: '#ff4f1f',
                fontSize: '11px', fontWeight: 800,
                borderRadius: '99px', padding: '1px 6px',
              }}>{count}</span>
            )}
          </button>
        </div>

        {/* Buscador */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#888" style={{
            position: 'absolute', left: '14px',
            top: '50%', transform: 'translateY(-50%)',
          }} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar plato..."
            style={{
              width: '100%', padding: '12px 12px 12px 40px',
              background: '#2a2a2a', border: 'none', borderRadius: '12px',
              color: '#fff', fontSize: '0.9rem',
              fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Filtros por categoría */}
      <div style={{
        display: 'flex', gap: '8px', overflowX: 'auto',
        padding: '16px 20px', scrollbarWidth: 'none',
      }}>
        <button onClick={() => setCatActiva(null)} style={{
          flexShrink: 0, padding: '8px 18px',
          background: catActiva === null ? '#ff4f1f' : '#fff',
          color: catActiva === null ? '#fff' : '#1a1a1a',
          border: 'none', borderRadius: '99px', fontSize: '0.82rem',
          fontWeight: 700, cursor: 'pointer',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s',
        }}>
          Todos
        </button>
        {categorias.map((cat) => (
          <button key={cat.id} onClick={() => setCatActiva(cat.id)} style={{
            flexShrink: 0, padding: '8px 18px',
            background: catActiva === cat.id ? '#ff4f1f' : '#fff',
            color: catActiva === cat.id ? '#fff' : '#1a1a1a',
            border: 'none', borderRadius: '99px', fontSize: '0.82rem',
            fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.2s',
          }}>
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Lista de platos */}
      <div style={{ padding: '0 20px 20px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
            Cargando menú...
          </div>
        ) : platosConBusqueda.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
            <p style={{ color: '#888' }}>No se encontraron platos</p>
          </div>
        ) : (
          platosConBusqueda.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '28px' }}>
              <h2 style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: '1rem', color: '#1a1a1a',
                marginBottom: '14px', display: 'flex',
                alignItems: 'center', gap: '8px',
              }}>
                {cat.nombre}
                <span style={{ background: '#e5e0d8', borderRadius: '99px',
                  padding: '2px 10px', fontSize: '0.75rem',
                  fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#888' }}>
                  {cat.platos.length}
                </span>
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '14px',
              }}>
                {cat.platos.map((plato) => (
                  <PlatoCard
                    key={plato.id}
                    plato={plato}
                    onClick={() => navigate(`/menu/plato/${plato.id}`)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}