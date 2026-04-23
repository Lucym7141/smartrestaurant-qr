import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPlato, getPlatoAlergia } from '../api/menu';
import useCarritoStore from '../store/useCarritoStore';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Minus, ShoppingBag, AlertTriangle, Box } from 'lucide-react';

export default function PlatoDetalle() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const sesionId   = useAuthStore((s) => s.sesionId);
  const agregarItem = useCarritoStore((s) => s.agregarItem);

  const [cantidad,   setCantidad]   = useState(1);
  const [variante,   setVariante]   = useState(null);
  const [adiciones,  setAdiciones]  = useState([]);
  const [removidos,  setRemovidos]  = useState([]);
  const [notas,      setNotas]      = useState('');
  const [verAR,      setVerAR]      = useState(false);
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
      alignItems: 'center', height: '100dvh', color: '#888' }}>
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
      plato_id:              plato.id,
      nombre:                plato.nombre,
      precio_unit:           Number(plato.precio_base) + (variante ? Number(variante.precio_extra) : 0),
      variante_id:           variante?.id || null,
      variante_nombre:       variante?.nombre || null,
      cantidad,
      notas,
      adiciones:             adiciones.map((a) => ({
        adicion_id: a.id, nombre: a.nombre, precio: a.precio, cantidad: a.cantidad,
      })),
      ingredientes_a_remover: removidos,
      alergia_confirmada:    alergiaConfirmada,
    });
    toast.success(`${plato.nombre} agregado al pedido`);
    navigate(-1);
  };

  return (
    <div style={{ background: '#f5f2ed', minHeight: '100dvh', paddingBottom: '100px' }}>

      {/* Imagen / AR */}
      <div style={{ position: 'relative', height: '280px', background: '#1a1a1a' }}>
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

        {/* Botón atrás */}
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: '52px', left: '16px',
          background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '12px',
          padding: '10px', cursor: 'pointer', backdropFilter: 'blur(4px)',
          display: 'flex',
        }}>
          <ArrowLeft size={20} color="#fff" />
        </button>

        {/* Botón AR */}
        {plato.modelo_ar_url && (
          <button onClick={() => setVerAR(!verAR)} style={{
            position: 'absolute', top: '52px', right: '16px',
            background: verAR ? '#ff4f1f' : 'rgba(0,0,0,0.5)',
            border: 'none', borderRadius: '12px',
            padding: '10px 14px', cursor: 'pointer',
            backdropFilter: 'blur(4px)', display: 'flex',
            alignItems: 'center', gap: '6px',
          }}>
            <Box size={16} color="#fff" />
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>
              {verAR ? 'Foto' : 'Ver en AR'}
            </span>
          </button>
        )}
      </div>

      <div style={{ padding: '20px' }}>

        {/* Info básica */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '1.5rem', color: '#1a1a1a', marginBottom: '6px' }}>
            {plato.nombre}
          </h1>
          {plato.descripcion && (
            <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {plato.descripcion}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center',
            gap: '12px', marginTop: '12px' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '1.5rem', color: '#ff4f1f' }}>
              ${Number(plato.precio_base).toLocaleString()}
            </span>
            {plato.tiempo_prep_min && (
              <span style={{ fontSize: '0.8rem', color: '#888',
                background: '#e5e0d8', borderRadius: '99px', padding: '4px 12px' }}>
                ⏱ {plato.tiempo_prep_min} min
              </span>
            )}
          </div>
        </div>

        {/* Alerta de alergia */}
        {alergiaInfo?.tiene_alergenos && (
          <div style={{
            background: '#fff3cd', borderRadius: '12px', padding: '14px 16px',
            marginBottom: '20px', border: '1px solid #f39c12',
          }}>
            <div style={{ display: 'flex', alignItems: 'center',
              gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle size={16} color="#f39c12" />
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#856404' }}>
                Contiene alérgenos
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#856404', marginBottom: '10px' }}>
              Este plato contiene: <strong>
                {alergiaInfo.ingredientes_alergenos.join(', ')}
              </strong>
            </p>
            <label style={{ display: 'flex', alignItems: 'center',
              gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#856404' }}>
              <input type="checkbox" checked={alergiaConfirmada}
                onChange={(e) => setAlergiaConfirmada(e.target.checked)} />
              Entiendo el riesgo y deseo continuar
            </label>
          </div>
        )}

        {/* Variantes */}
        {plato.variantes?.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1rem', color: '#1a1a1a', marginBottom: '12px' }}>
              Variante
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {plato.variantes.filter((v) => v.disponible).map((v) => (
                <button key={v.id} onClick={() => setVariante(v.id === variante?.id ? null : v)}
                  style={{
                    padding: '8px 16px',
                    background: variante?.id === v.id ? '#1a1a1a' : '#fff',
                    color: variante?.id === v.id ? '#fff' : '#1a1a1a',
                    border: '1.5px solid',
                    borderColor: variante?.id === v.id ? '#1a1a1a' : '#e5e0d8',
                    borderRadius: '99px', fontSize: '0.82rem',
                    fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>
                  {v.nombre}
                  {Number(v.precio_extra) > 0 &&
                    <span style={{ color: '#ff4f1f', marginLeft: '6px' }}>
                      +${Number(v.precio_extra).toLocaleString()}
                    </span>
                  }
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Adiciones */}
        {plato.adiciones?.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1rem', color: '#1a1a1a', marginBottom: '12px' }}>
              Adiciones
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {plato.adiciones.filter((a) => a.disponible).map((ad) => {
                const seleccionada = adiciones.find((a) => a.id === ad.id);
                return (
                  <div key={ad.id} onClick={() => toggleAdicion(ad)} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '14px 16px',
                    background: seleccionada ? '#ffe8df' : '#fff',
                    border: '1.5px solid',
                    borderColor: seleccionada ? '#ff4f1f' : '#e5e0d8',
                    borderRadius: '12px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.88rem',
                        color: '#1a1a1a' }}>{ad.nombre}</p>
                      {ad.descripcion && (
                        <p style={{ fontSize: '0.75rem', color: '#888' }}>
                          {ad.descripcion}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
                        color: '#ff4f1f', fontSize: '0.9rem' }}>
                        +${Number(ad.precio).toLocaleString()}
                      </span>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '99px',
                        background: seleccionada ? '#ff4f1f' : '#e5e0d8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}>
                        <Plus size={12} color={seleccionada ? '#fff' : '#888'} />
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
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1rem', color: '#1a1a1a', marginBottom: '12px' }}>
              Quitar ingredientes
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {plato.ingredientes.filter((i) => i.es_removible).map((ing) => (
                <button key={ing.id} onClick={() => toggleRemovido(ing)}
                  style={{
                    padding: '7px 14px',
                    background: removidos.includes(ing.id) ? '#e74c3c' : '#fff',
                    color: removidos.includes(ing.id) ? '#fff' : '#1a1a1a',
                    border: '1.5px solid',
                    borderColor: removidos.includes(ing.id) ? '#e74c3c' : '#e5e0d8',
                    borderRadius: '99px', fontSize: '0.8rem',
                    fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>
                  {removidos.includes(ing.id) ? '✕ ' : ''}{ing.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notas */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: '1rem', color: '#1a1a1a', marginBottom: '10px' }}>
            Notas al cocinero
          </h3>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: término tres cuartos, sin sal..."
            rows={3}
            style={{
              width: '100%', padding: '14px', border: '1.5px solid #e5e0d8',
              borderRadius: '12px', fontSize: '0.88rem', resize: 'none',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              background: '#fff', outline: 'none', color: '#1a1a1a',
            }}
          />
        </div>
      </div>

      {/* Footer fijo — cantidad + agregar */}
      <div style={{
        position: 'fixed', bottom: '72px', left: 0, right: 0,
        background: '#fff', padding: '16px 20px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        {/* Selector cantidad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px',
          background: '#f5f2ed', borderRadius: '12px', padding: '8px 14px' }}>
          <button onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', padding: '2px' }}>
            <Minus size={18} color="#1a1a1a" />
          </button>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '1.1rem', minWidth: '20px', textAlign: 'center' }}>
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
          flex: 1, padding: '14px', background: '#ff4f1f',
          color: '#fff', border: 'none', borderRadius: '12px',
          fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px',
          fontFamily: 'Plus Jakarta Sans, sans-serif', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '8px',
        }}>
          <ShoppingBag size={18} />
          AGREGAR · ${calcularTotal()}
        </button>
      </div>
    </div>
  );
}