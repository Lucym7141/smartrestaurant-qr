import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPlato, getPlatoAlergia } from '../api/menu';
import useCarritoStore from '../store/useCarritoStore';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Minus, ShoppingBag, AlertTriangle, Box, Clock, Check } from 'lucide-react';

export default function PlatoDetalle() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const sesionId    = useAuthStore((s) => s.sesionId);
  const agregarItem = useCarritoStore((s) => s.agregarItem);

  const [cantidad,          setCantidad]          = useState(1);
  const [variante,          setVariante]          = useState(null);
  const [adiciones,         setAdiciones]         = useState([]);
  const [removidos,         setRemovidos]         = useState([]);
  const [notas,             setNotas]             = useState('');
  const [verAR,             setVerAR]             = useState(false);
  const [alergiaConfirmada, setAlergiaConfirmada] = useState(false);

  const { data: plato, isLoading } = useQuery({
    queryKey: ['plato', id],
    queryFn:  () => getPlato(id).then((r) => r.data),
  });

  const { data: alergiaInfo } = useQuery({
    queryKey: ['alergia-plato', id],
    queryFn:  () => getPlatoAlergia(id).then((r) => r.data),
    enabled:  !!id,
  });

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center',
      alignItems: 'center', height: '100dvh', color: '#888',
      fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      Cargando plato...
    </div>
  );

  if (!plato) return null;

  const toggleAdicion = (ad) => {
    setAdiciones((prev) =>
      prev.find((a) => a.id === ad.id)
        ? prev.filter((a) => a.id !== ad.id)
        : [...prev, { ...ad, cantidad: 1 }]
    );
  };

  const toggleRemovido = (ing) => {
    setRemovidos((prev) =>
      prev.includes(ing.id)
        ? prev.filter((i) => i !== ing.id)
        : [...prev, ing.id]
    );
  };

  const calcularTotal = () => {
    let total = Number(plato.precio_base);
    if (variante) total += Number(variante.precio_extra);
    adiciones.forEach((ad) => { total += Number(ad.precio) * ad.cantidad; });
    return (total * cantidad).toLocaleString();
  };

  const handleAgregar = () => {
    if (!sesionId) {
      toast.error('Escanea el QR de tu mesa primero');
      return;
    }
    if (alergiaInfo?.tiene_alergenos && !alergiaConfirmada) {
      toast.error('Confirma que entiendes el riesgo alérgico');
      return;
    }
    agregarItem({
      plato_id:               plato.id,
      nombre:                 plato.nombre,
      precio_unit:            Number(plato.precio_base) + (variante ? Number(variante.precio_extra) : 0),
      variante_id:            variante?.id || null,
      variante_nombre:        variante?.nombre || null,
      cantidad,
      notas,
      adiciones:              adiciones.map((a) => ({
        adicion_id: a.id, nombre: a.nombre, precio: a.precio, cantidad: a.cantidad,
      })),
      ingredientes_a_remover: removidos,
      alergia_confirmada:     alergiaConfirmada,
    });
    toast.success(`${plato.nombre} agregado al pedido`);
    navigate(-1);
  };

  return (
    <div style={{ background: '#f5f2ed', minHeight: '100dvh',
      paddingBottom: '120px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Hero imagen */}
      <div style={{ position: 'relative', height: '320px', background: '#1a1a1a' }}>
        {verAR && plato.modelo_ar_url ? (
          <model-viewer
            src={plato.modelo_ar_url}
            ar ar-modes="webxr scene-viewer quick-look"
            camera-controls auto-rotate
            style={{ width: '100%', height: '100%' }}
          />
        ) : plato.imagen_url ? (
          <img src={plato.imagen_url} alt={plato.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
            🍽️
          </div>
        )}

        {/* Gradiente inferior */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
          background: 'linear-gradient(to top, #f5f2ed, transparent)',
        }} />

        {/* Botón atrás */}
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: '52px', left: '16px',
          background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '12px',
          padding: '10px', cursor: 'pointer', backdropFilter: 'blur(8px)',
          display: 'flex',
        }}>
          <ArrowLeft size={20} color="#fff" />
        </button>

        {/* Botón AR */}
        {plato.modelo_ar_url && (
          <button onClick={() => setVerAR(!verAR)} style={{
            position: 'absolute', top: '52px', right: '16px',
            background: verAR ? '#ff4f1f' : 'rgba(0,0,0,0.45)',
            border: 'none', borderRadius: '12px',
            padding: '10px 14px', cursor: 'pointer',
            backdropFilter: 'blur(8px)', display: 'flex',
            alignItems: 'center', gap: '6px',
          }}>
            <Box size={15} color="#fff" />
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>
              {verAR ? 'Foto' : 'Ver en 3D'}
            </span>
          </button>
        )}
      </div>

      <div style={{ padding: '0 20px 20px', marginTop: '-20px' }}>

        {/* Info básica */}
        <div style={{ background: '#fff', borderRadius: '20px',
          padding: '20px', marginBottom: '14px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '1.5rem', color: '#1a1a1a', marginBottom: '8px',
            letterSpacing: '-0.5px' }}>
            {plato.nombre}
          </h1>
          {plato.descripcion && (
            <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.6,
              marginBottom: '14px' }}>
              {plato.descripcion}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '1.6rem', color: '#ff4f1f' }}>
              ${Number(plato.precio_base).toLocaleString()}
            </span>
            {plato.tiempo_prep_min && (
              <span style={{ fontSize: '0.78rem', color: '#888',
                background: '#f5f2ed', borderRadius: '99px', padding: '5px 12px',
                display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                <Clock size={12} /> {plato.tiempo_prep_min} min
              </span>
            )}
          </div>
        </div>

        {/* Alerta alergia */}
        {alergiaInfo?.tiene_alergenos && (
          <div style={{
            background: '#fff9e6', borderRadius: '16px', padding: '16px',
            marginBottom: '14px', border: '1px solid #f39c12',
          }}>
            <div style={{ display: 'flex', alignItems: 'center',
              gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px',
                background: '#f39c1220', display: 'flex',
                alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={14} color="#f39c12" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#856404' }}>
                Contiene alérgenos
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#856404', marginBottom: '12px',
              lineHeight: 1.5 }}>
              Este plato contiene: <strong>
                {alergiaInfo.ingredientes_alergenos.join(', ')}
              </strong>
            </p>
            <label style={{ display: 'flex', alignItems: 'center',
              gap: '10px', cursor: 'pointer' }}>
              <div onClick={() => setAlergiaConfirmada(!alergiaConfirmada)} style={{
                width: '20px', height: '20px', borderRadius: '6px',
                border: `2px solid ${alergiaConfirmada ? '#f39c12' : '#ddd'}`,
                background: alergiaConfirmada ? '#f39c12' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s',
              }}>
                {alergiaConfirmada && <Check size={12} color="#fff" />}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#856404', lineHeight: 1.4 }}>
                Entiendo el riesgo y deseo continuar
              </span>
            </label>
          </div>
        )}

        {/* Variantes */}
        {plato.variantes?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px',
            padding: '16px', marginBottom: '14px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '12px' }}>
              Elige tu variante
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {plato.variantes.filter((v) => v.disponible).map((v) => (
                <button key={v.id}
                  onClick={() => setVariante(v.id === variante?.id ? null : v)}
                  style={{
                    padding: '9px 16px',
                    background: variante?.id === v.id ? '#1a1a1a' : '#f5f2ed',
                    color: variante?.id === v.id ? '#fff' : '#1a1a1a',
                    border: '2px solid',
                    borderColor: variante?.id === v.id ? '#1a1a1a' : 'transparent',
                    borderRadius: '99px', fontSize: '0.82rem',
                    fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    transition: 'all 0.2s',
                  }}>
                  {v.nombre}
                  {Number(v.precio_extra) > 0 && (
                    <span style={{ color: variante?.id === v.id ? '#ff4f1f' : '#ff4f1f',
                      marginLeft: '6px' }}>
                      +${Number(v.precio_extra).toLocaleString()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Adiciones */}
        {plato.adiciones?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px',
            padding: '16px', marginBottom: '14px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '12px' }}>
              Adiciones
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {plato.adiciones.filter((a) => a.disponible).map((ad) => {
                const seleccionada = adiciones.find((a) => a.id === ad.id);
                return (
                  <div key={ad.id} onClick={() => toggleAdicion(ad)} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '13px 14px',
                    background: seleccionada ? '#fff5f2' : '#fafaf9',
                    border: '1.5px solid',
                    borderColor: seleccionada ? '#ff4f1f' : '#f0ede8',
                    borderRadius: '12px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.88rem',
                        color: '#1a1a1a' }}>{ad.nombre}</p>
                      {ad.descripcion && (
                        <p style={{ fontSize: '0.73rem', color: '#aaa', marginTop: '2px' }}>
                          {ad.descripcion}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
                        color: '#ff4f1f', fontSize: '0.88rem' }}>
                        +${Number(ad.precio).toLocaleString()}
                      </span>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '8px',
                        background: seleccionada ? '#ff4f1f' : '#e5e0d8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}>
                        {seleccionada
                          ? <Check size={13} color="#fff" />
                          : <Plus size={13} color="#888" />
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quitar ingredientes */}
        {plato.ingredientes?.filter((i) => i.es_removible).length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px',
            padding: '16px', marginBottom: '14px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '12px' }}>
              Quitar ingredientes
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {plato.ingredientes.filter((i) => i.es_removible).map((ing) => (
                <button key={ing.id} onClick={() => toggleRemovido(ing)}
                  style={{
                    padding: '8px 14px',
                    background: removidos.includes(ing.id) ? '#fdeaea' : '#f5f2ed',
                    color: removidos.includes(ing.id) ? '#e74c3c' : '#1a1a1a',
                    border: '1.5px solid',
                    borderColor: removidos.includes(ing.id) ? '#e74c3c' : 'transparent',
                    borderRadius: '99px', fontSize: '0.8rem',
                    fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    transition: 'all 0.2s',
                  }}>
                  {removidos.includes(ing.id) ? '✕ ' : ''}{ing.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notas */}
        <div style={{ background: '#fff', borderRadius: '16px',
          padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '12px' }}>
            Notas al cocinero
          </h3>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: término tres cuartos, sin sal..."
            rows={3}
            style={{
              width: '100%', padding: '13px 14px', resize: 'none',
              border: '1.5px solid #e5e0d8', borderRadius: '12px',
              fontSize: '0.88rem', fontFamily: 'Plus Jakarta Sans, sans-serif',
              background: '#fafaf9', outline: 'none', color: '#1a1a1a',
              boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#ff4f1f'}
            onBlur={e => e.target.style.borderColor = '#e5e0d8'}
          />
        </div>
      </div>

      {/* Footer fijo */}
      <div style={{
        position: 'fixed', bottom: '72px', left: 0, right: 0,
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '14px 20px',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        {/* Selector cantidad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px',
          background: '#f5f2ed', borderRadius: '14px', padding: '10px 16px' }}>
          <button onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', padding: '2px' }}>
            <Minus size={18} color="#1a1a1a" />
          </button>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '1.2rem', minWidth: '22px', textAlign: 'center',
            color: '#1a1a1a' }}>
            {cantidad}
          </span>
          <button onClick={() => setCantidad((c) => c + 1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', padding: '2px' }}>
            <Plus size={18} color="#ff4f1f" />
          </button>
        </div>

        {/* Botón agregar */}
        <button onClick={handleAgregar} style={{
          flex: 1, padding: '15px', background: '#ff4f1f',
          color: '#fff', border: 'none', borderRadius: '14px',
          fontSize: '0.88rem', fontWeight: 700,
          fontFamily: 'Plus Jakarta Sans, sans-serif', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '8px',
          boxShadow: '0 4px 14px rgba(255,79,31,0.35)',
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <ShoppingBag size={17} />
          Agregar · ${calcularTotal()}
        </button>
      </div>
    </div>
  );
}