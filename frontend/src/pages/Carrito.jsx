import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { crearPedido } from '../api/pedidos';
import useCarritoStore from '../store/useCarritoStore';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, ShoppingBag, ChevronRight, MapPin } from 'lucide-react';

function ItemCarrito({ item, onEliminar }) {
  const subtotalAdiciones = (item.adiciones || [])
    .reduce((a, ad) => a + Number(ad.precio) * ad.cantidad, 0);
  const total = (Number(item.precio_unit) + subtotalAdiciones) * item.cantidad;

  return (
    <div style={{
      background: '#fff', borderRadius: '18px', padding: '16px',
      marginBottom: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem',
            color: '#1a1a1a', marginBottom: '2px' }}>
            {item.nombre}
          </h3>
          {item.variante_nombre && (
            <span style={{ fontSize: '0.73rem', color: '#aaa',
              background: '#f5f2ed', borderRadius: '99px',
              padding: '2px 8px', display: 'inline-block' }}>
              {item.variante_nombre}
            </span>
          )}
        </div>
        <button onClick={() => onEliminar(item._id)} style={{
          background: '#fdeaea', border: 'none', cursor: 'pointer',
          padding: '8px', borderRadius: '10px', color: '#e74c3c',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Trash2 size={15} />
        </button>
      </div>

      {/* Adiciones */}
      {item.adiciones?.length > 0 && (
        <div style={{ background: '#fafaf9', borderRadius: '10px',
          padding: '8px 12px', marginBottom: '10px',
          border: '1px solid #f0ede8' }}>
          {item.adiciones.map((ad, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: '0.75rem', color: '#999',
              marginBottom: i < item.adiciones.length - 1 ? '4px' : 0 }}>
              <span>+ {ad.nombre} ×{ad.cantidad}</span>
              <span style={{ color: '#ff4f1f' }}>
                +${(Number(ad.precio) * ad.cantidad).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Sin ingredientes */}
      {item.ingredientes_a_remover?.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: '#e74c3c',
            background: '#fdeaea', borderRadius: '99px', padding: '2px 8px' }}>
            Sin: {item.ingredientes_a_remover.join(', ')}
          </span>
        </div>
      )}

      {/* Notas */}
      {item.notas && (
        <p style={{ fontSize: '0.73rem', color: '#bbb', fontStyle: 'italic',
          marginBottom: '10px', paddingLeft: '4px' }}>
          "{item.notas}"
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', paddingTop: '10px',
        borderTop: '1px solid #f5f2ed' }}>
        <span style={{ fontSize: '0.78rem', color: '#bbb',
          background: '#f5f2ed', borderRadius: '99px', padding: '3px 10px',
          fontWeight: 600 }}>
          ×{item.cantidad}
        </span>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '1rem', color: '#ff4f1f' }}>
          ${total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function Carrito() {
  const navigate  = useNavigate();
  const sesionId  = useAuthStore((s) => s.sesionId);
  const { items, eliminarItem, limpiarCarrito } = useCarritoStore();
  const total     = useCarritoStore((s) => s.total);

  const { mutate: enviarPedido, isPending } = useMutation({
    mutationFn: crearPedido,
    onSuccess: () => {
      limpiarCarrito();
      toast.success('¡Pedido enviado a cocina! 🍳');
      navigate('/pedidos');
    },
    onError: () => toast.error('Error al enviar el pedido'),
  });

  const handleConfirmar = () => {
    if (!sesionId) {
      toast.error('Primero escanea el QR de tu mesa');
      navigate('/mesas');
      return;
    }
    if (items.length === 0) {
      toast.error('Tu pedido está vacío');
      return;
    }
    enviarPedido({
      sesion_id: sesionId,
      items: items.map((item) => ({
        plato_id:               item.plato_id,
        variante_id:            item.variante_id,
        cantidad:               item.cantidad,
        notas:                  item.notas || '',
        alergia_confirmada:     item.alergia_confirmada || false,
        adiciones:              (item.adiciones || []).map((a) => ({
          adicion_id: a.adicion_id,
          cantidad:   a.cantidad,
        })),
        ingredientes_a_remover: item.ingredientes_a_remover || [],
      })),
    });
  };

  return (
    <div style={{ background: '#f5f2ed', minHeight: '100dvh',
      paddingBottom: '200px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '52px 20px 24px',
        borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '10px', cursor: 'pointer',
            display: 'flex',
          }}>
            <ArrowLeft size={20} color="#fff" />
          </button>
          <div>
            <p style={{ color: '#555', fontSize: '0.75rem', marginBottom: '2px' }}>
              {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
            </p>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '1.8rem', color: '#fff', letterSpacing: '-0.5px' }}>
              Mi Pedido<span style={{ color: '#ff4f1f' }}>.</span>
            </h1>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Aviso mesa */}
        {!sesionId && (
          <div onClick={() => navigate('/mesas')} style={{
            background: '#fff9e6', borderRadius: '16px',
            padding: '14px 16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '12px',
            cursor: 'pointer', border: '1px solid #f39c12',
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px',
              background: '#f39c1220', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={18} color="#f39c12" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#856404' }}>
                No estás en una mesa
              </p>
              <p style={{ fontSize: '0.73rem', color: '#9a7605' }}>
                Escanea el QR de tu mesa para continuar
              </p>
            </div>
            <ChevronRight size={16} color="#f39c12" />
          </div>
        )}

        {/* Carrito vacío */}
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px',
              background: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '2.2rem' }}>
              🛒
            </div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1.1rem', color: '#1a1a1a', marginBottom: '8px' }}>
              Tu pedido está vacío
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.82rem',
              marginBottom: '24px', lineHeight: 1.6 }}>
              Explora el menú y agrega lo que desees
            </p>
            <button onClick={() => navigate('/menu')} style={{
              background: '#ff4f1f', color: '#fff', border: 'none',
              borderRadius: '14px', padding: '14px 32px',
              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: '0 4px 14px rgba(255,79,31,0.35)',
            }}>
              Ver Menú
            </button>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <ItemCarrito key={item._id} item={item} onEliminar={eliminarItem} />
            ))}

            <button onClick={() => navigate('/menu')} style={{
              width: '100%', padding: '14px',
              background: 'none', border: '2px dashed #d5d0c8',
              borderRadius: '14px', color: '#aaa', fontSize: '0.85rem',
              fontWeight: 600, cursor: 'pointer', marginTop: '4px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#ff4f1f'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#d5d0c8'}
            >
              + Agregar más platos
            </button>
          </>
        )}
      </div>

      {/* Footer fijo */}
      {items.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '72px', left: 0, right: 0,
          background: '#fff',
          borderTop: '1px solid #f0ede8',
          borderRadius: '24px 24px 0 0',
          padding: '16px 20px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.1)',
        }}>
          {/* Desglose */}
          <div style={{ display: 'flex', flexDirection: 'column',
            gap: '6px', marginBottom: '14px' }}>
            {items.map((item) => {
              const subtotalAd = (item.adiciones || [])
                .reduce((a, ad) => a + Number(ad.precio) * ad.cantidad, 0);
              const t = (Number(item.precio_unit) + subtotalAd) * item.cantidad;
              return (
                <div key={item._id} style={{ display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem', color: '#aaa' }}>
                  <span>{item.nombre} ×{item.cantidad}</span>
                  <span>${t.toLocaleString()}</span>
                </div>
              );
            })}
            <div style={{ borderTop: '1.5px solid #f5f2ed', paddingTop: '10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a' }}>
                Total
              </span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: '1.3rem', color: '#ff4f1f' }}>
                ${total.toLocaleString()}
              </span>
            </div>
          </div>

          <button onClick={handleConfirmar} disabled={isPending} style={{
            width: '100%', padding: '16px',
            background: isPending ? '#ccc' : '#ff4f1f',
            color: '#fff', border: 'none', borderRadius: '14px',
            fontSize: '0.88rem', fontWeight: 700,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            cursor: isPending ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
            boxShadow: isPending ? 'none' : '0 4px 14px rgba(255,79,31,0.35)',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => { if (!isPending) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <ShoppingBag size={18} />
            {isPending ? 'Enviando a cocina...' : 'Confirmar pedido'}
          </button>
        </div>
      )}
    </div>
  );
}