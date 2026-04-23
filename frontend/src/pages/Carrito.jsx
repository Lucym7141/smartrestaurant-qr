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
      background: '#fff', borderRadius: '16px', padding: '16px',
      marginBottom: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem',
            color: '#1a1a1a', marginBottom: '2px' }}>
            {item.nombre}
          </h3>
          {item.variante_nombre && (
            <span style={{ fontSize: '0.75rem', color: '#888' }}>
              Variante: {item.variante_nombre}
            </span>
          )}
        </div>
        <button onClick={() => onEliminar(item._id)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px', color: '#e74c3c',
        }}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Adiciones */}
      {item.adiciones?.length > 0 && (
        <div style={{ background: '#f5f2ed', borderRadius: '8px',
          padding: '8px 12px', marginBottom: '10px' }}>
          {item.adiciones.map((ad, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: '0.78rem', color: '#888', marginBottom: i < item.adiciones.length - 1 ? '4px' : 0 }}>
              <span>+ {ad.nombre} ×{ad.cantidad}</span>
              <span style={{ color: '#ff4f1f' }}>
                +${(Number(ad.precio) * ad.cantidad).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Ingredientes removidos */}
      {item.ingredientes_a_remover?.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: '#e74c3c' }}>
            Sin: {item.ingredientes_a_remover.join(', ')}
          </span>
        </div>
      )}

      {/* Notas */}
      {item.notas && (
        <p style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic',
          marginBottom: '10px' }}>
          "{item.notas}"
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: '#888' }}>
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
  const navigate     = useNavigate();
  const sesionId     = useAuthStore((s) => s.sesionId);
  const { items, eliminarItem, limpiarCarrito } = useCarritoStore();
  const total        = useCarritoStore((s) => s.total);

  const { mutate: enviarPedido, isPending } = useMutation({
    mutationFn: crearPedido,
    onSuccess: (res) => {
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
    <div style={{ background: '#f5f2ed', minHeight: '100dvh', paddingBottom: '140px' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '48px 20px 24px',
        borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none',
            borderRadius: '12px', padding: '10px', cursor: 'pointer',
            display: 'flex',
          }}>
            <ArrowLeft size={20} color="#fff" />
          </button>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '1.5rem', color: '#fff' }}>
              Mi Pedido<span style={{ color: '#ff4f1f' }}>.</span>
            </h1>
            <p style={{ color: '#888', fontSize: '0.8rem' }}>
              {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Aviso mesa */}
        {!sesionId && (
          <div onClick={() => navigate('/mesas')} style={{
            background: '#fff3cd', borderRadius: '14px',
            padding: '14px 16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '12px',
            cursor: 'pointer', border: '1px solid #f39c12',
          }}>
            <MapPin size={20} color="#f39c12" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#856404' }}>
                No estás en una mesa
              </p>
              <p style={{ fontSize: '0.75rem', color: '#856404' }}>
                Escanea el QR de tu mesa para continuar
              </p>
            </div>
            <ChevronRight size={16} color="#f39c12" />
          </div>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🛒</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1.2rem', color: '#1a1a1a', marginBottom: '8px' }}>
              Tu pedido está vacío
            </h3>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '24px' }}>
              Explora el menú y agrega lo que desees
            </p>
            <button onClick={() => navigate('/menu')} style={{
              background: '#ff4f1f', color: '#fff', border: 'none',
              borderRadius: '12px', padding: '14px 28px',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>
              Ver Menú
            </button>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <ItemCarrito key={item._id} item={item}
                onEliminar={eliminarItem} />
            ))}

            {/* Botón agregar más */}
            <button onClick={() => navigate('/menu')} style={{
              width: '100%', padding: '14px',
              background: 'none', border: '2px dashed #e5e0d8',
              borderRadius: '14px', color: '#888', fontSize: '0.85rem',
              fontWeight: 600, cursor: 'pointer', marginTop: '4px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>
              + Agregar más platos
            </button>
          </>
        )}
      </div>

      {/* Footer fijo con total */}
      {items.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '72px', left: 0, right: 0,
          background: '#fff', padding: '16px 20px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
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
                  justifyContent: 'space-between', fontSize: '0.8rem', color: '#888' }}>
                  <span>{item.nombre} ×{item.cantidad}</span>
                  <span>${t.toLocaleString()}</span>
                </div>
              );
            })}
            <div style={{ borderTop: '1px solid #e5e0d8', paddingTop: '8px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Total</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: '1.2rem', color: '#ff4f1f' }}>
                ${total.toLocaleString()}
              </span>
            </div>
          </div>

          <button onClick={handleConfirmar} disabled={isPending} style={{
            width: '100%', padding: '16px',
            background: isPending ? '#ccc' : '#ff4f1f',
            color: '#fff', border: 'none', borderRadius: '14px',
            fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            cursor: isPending ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
          }}>
            <ShoppingBag size={18} />
            {isPending ? 'ENVIANDO A COCINA...' : 'CONFIRMAR PEDIDO'}
          </button>
        </div>
      )}
    </div>
  );
}