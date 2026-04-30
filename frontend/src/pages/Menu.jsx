import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getMenu } from '../api/menu';
import { Search, ShoppingBag, Clock, ChevronRight } from 'lucide-react';
import useCarritoStore from '../store/useCarritoStore';

function PlatoCard({ plato, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      overflow: 'hidden', cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex', flexDirection: 'row',
      alignItems: 'stretch', height: '100px',
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
      {/* Imagen */}
      <div style={{ position: 'relative', width: '100px', flexShrink: 0 }}>
        {plato.imagen_url ? (
          <img src={plato.imagen_url} alt={plato.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f5f2ed',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '2rem' }}>🍽️</div>
        )}
        {plato.modelo_ar_url && (
          <div style={{
            position: 'absolute', top: '6px', left: '6px',
            background: 'rgba(26,26,26,0.85)', borderRadius: '6px',
            padding: '2px 6px',
          }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#ff4f1f' }}>AR</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex',
        flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '0.88rem',
            color: '#1a1a1a', marginBottom: '4px', lineHeight: 1.2 }}>
            {plato.nombre}
          </h3>
          {plato.descripcion && (
            <p style={{
              fontSize: '0.73rem', color: '#999', lineHeight: 1.4,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {plato.descripcion}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '1rem', color: '#ff4f1f' }}>
            ${Number(plato.precio_base).toLocaleString()}
          </span>
          {plato.tiempo_prep_min && (
            <span style={{ fontSize: '10px', color: '#aaa',
              display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={10} /> {plato.tiempo_prep_min} min
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Menu() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda]   = useState('');
  const [catActiva, setCatActiva] = useState(null);
  const count = useCarritoStore((s) => s.count);

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['menu'],
    queryFn:  () => getMenu().then((r) => r.data),
  });

  const totalPlatos = categorias.reduce((a, c) => a + c.platos.length, 0);

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
    <div style={{ background: '#f5f2ed', minHeight: '100dvh', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '52px 20px 20px',
        borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <p style={{ color: '#555', fontSize: '0.78rem', marginBottom: '4px' }}>
              {totalPlatos} platos disponibles
            </p>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '2rem', color: '#fff', letterSpacing: '-0.5px' }}>
              Nuestro menú<span style={{ color: '#ff4f1f' }}>.</span>
            </h1>
          </div>
          <button onClick={() => navigate('/carrito')} style={{
            position: 'relative', background: '#ff4f1f',
            border: 'none', borderRadius: '14px', padding: '12px',
            cursor: 'pointer', display: 'flex',
            boxShadow: '0 4px 14px rgba(255,79,31,0.4)',
          }}>
            <ShoppingBag size={20} color="#fff" />
            {count > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: '#fff', color: '#ff4f1f',
                fontSize: '11px', fontWeight: 800,
                borderRadius: '99px', padding: '1px 6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}>{count}</span>
            )}
          </button>
        </div>

        {/* Buscador */}
        <div style={{ position: 'relative' }}>
          <Search size={15} color="#666" style={{
            position: 'absolute', left: '14px',
            top: '50%', transform: 'translateY(-50%)',
          }} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar plato..."
            style={{
              width: '100%', padding: '13px 12px 13px 40px',
              background: '#2a2a2a', border: '1.5px solid transparent',
              borderRadius: '14px', color: '#fff', fontSize: '0.88rem',
              fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
              boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#ff4f1f'}
            onBlur={e => e.target.style.borderColor = 'transparent'}
          />
        </div>
      </div>

      {/* Filtros por categoría */}
      <div style={{
        display: 'flex', gap: '8px', overflowX: 'auto',
        padding: '16px 20px 8px', scrollbarWidth: 'none',
      }}>
        {[{ id: null, nombre: 'Todos' }, ...categorias].map((cat) => (
          <button key={cat.id ?? 'todos'} onClick={() => setCatActiva(cat.id)} style={{
            flexShrink: 0, padding: '8px 18px',
            background: catActiva === cat.id ? '#ff4f1f' : '#fff',
            color: catActiva === cat.id ? '#fff' : '#1a1a1a',
            border: 'none', borderRadius: '99px', fontSize: '0.8rem',
            fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            transition: 'all 0.2s',
          }}>
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Lista de platos */}
      <div style={{ padding: '8px 20px 100px' }}>
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
              {/* Cabecera categoría */}
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  fontSize: '1rem', color: '#1a1a1a',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  {cat.nombre}
                  <span style={{
                    background: '#e5e0d8', borderRadius: '99px',
                    padding: '2px 8px', fontSize: '0.7rem',
                    fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#888',
                  }}>
                    {cat.platos.length}
                  </span>
                </h2>
                <button onClick={() => setCatActiva(cat.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '2px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#ff4f1f', fontSize: '0.75rem', fontWeight: 600,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>
                  Ver todos <ChevronRight size={13} />
                </button>
              </div>

              {/* Cards en lista */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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