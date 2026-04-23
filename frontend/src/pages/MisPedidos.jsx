import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMisPedidos, confirmarRecepcion, cancelarPedido } from '../api/pedidos';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, ChefHat, Truck, XCircle } from 'lucide-react';

const ESTADO_CONFIG = {
  pendiente:       { icon: Clock,        color: '#f39c12', label: 'Pendiente',        bg: '#fef6e4' },
  en_preparacion:  { icon: ChefHat,      color: '#2e75b6', label: 'En preparación',   bg: '#e8f0fb' },
  listo:           { icon: Truck,        color: '#27ae60', label: '¡Listo! En camino', bg: '#e8f8f0' },
  entregado:       { icon: CheckCircle,  color: '#888',    label: 'Entregado',         bg: '#f5f5f5' },
};

function PedidoCard({ pedido, onConfirmar, onCancelar }) {
  const config = ESTADO_CONFIG[pedido.estado_nombre] || ESTADO_CONFIG.pendiente;
  const Icon   = config.icon;

  return (
    <div style={{
      background: '#fff', borderRadius: '20px',
      overflow: 'hidden', marginBottom: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    }}>
      {/* Header del pedido */}
      <div style={{
        background: config.bg, padding: '14px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={16} color={config.color} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: config.color }}>
            {config.label}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#888' }}>
          {new Date(pedido.fecha).toLocaleTimeString('es-CO', {
            hour: '2-digit', minute: '2-digit'
          })}
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '12px' }}>
          {pedido.nombre_pedido}
        </h3>

        {/* Ítems del pedido */}
        {pedido.detalles?.map((detalle, i) => (
          <div key={i} style={{
            paddingBottom: '10px', marginBottom: '10px',
            borderBottom: i < pedido.detalles.length - 1
              ? '1px solid #f5f2ed' : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a1a1a' }}>
                {detalle.plato_nombre}
                {detalle.variante_nombre && (
                  <span style={{ color: '#888', fontWeight: 400 }}>
                    {' '}· {detalle.variante_nombre}
                  </span>
                )}
              </span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: '0.88rem', color: '#ff4f1f' }}>
                ${Number(detalle.subtotal).toLocaleString()}
              </span>
            </div>

            {/* Adiciones */}
            {detalle.adiciones?.length > 0 && (
              <div style={{ paddingLeft: '10px' }}>
                {detalle.adiciones.map((ad, j) => (
                  <div key={j} style={{ display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem', color: '#888', marginBottom: '2px' }}>
                    <span>+ {ad.adicion_nombre} ×{ad.cantidad}</span>
                    <span style={{ color: '#ff4f1f' }}>
                      +${(Number(ad.precio_aplicado) * ad.cantidad).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Notas */}
            {detalle.notas && (
              <p style={{ fontSize: '0.72rem', color: '#aaa',
                fontStyle: 'italic', marginTop: '4px' }}>
                "{detalle.notas}"
              </p>
            )}
          </div>
        ))}

        {/* Total del pedido */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', paddingTop: '10px',
          borderTop: '1.5px solid #f5f2ed' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>
            Total pedido
          </span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '1.1rem', color: '#ff4f1f' }}>
            ${Number(pedido.total_pedido).toLocaleString()}
          </span>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
          {pedido.estado_nombre === 'listo' && (
            <button onClick={() => onConfirmar(pedido.id)} style={{
              flex: 1, padding: '12px',
              background: '#27ae60', color: '#fff', border: 'none',
              borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '6px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>
              <CheckCircle size={16} />
              Pedido recibido ✓
            </button>
          )}
          {pedido.estado_nombre === 'pendiente' && (
            <button onClick={() => onCancelar(pedido.id)} style={{
              padding: '12px 16px', background: '#fdeaea',
              color: '#e74c3c', border: 'none', borderRadius: '12px',
              fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>
              <XCircle size={16} />
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MisPedidos() {
  const sesionId    = useAuthStore((s) => s.sesionId);
  const queryClient = useQueryClient();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['mis-pedidos', sesionId],
    queryFn:  () => getMisPedidos(sesionId).then((r) => r.data),
    enabled:  !!sesionId,
    refetchInterval: 10000,
  });

  const { mutate: confirmar } = useMutation({
    mutationFn: confirmarRecepcion,
    onSuccess: () => {
      toast.success('¡Buen provecho! 🍽️');
      queryClient.invalidateQueries(['mis-pedidos']);
    },
  });

  const { mutate: cancelar } = useMutation({
    mutationFn: (id) => cancelarPedido({ pedido_id: id, motivo: 'Cancelado por el cliente' }),
    onSuccess: () => {
      toast.success('Pedido cancelado');
      queryClient.invalidateQueries(['mis-pedidos']);
    },
    onError: () => toast.error('No se puede cancelar en este estado'),
  });

  const totalConsumo = pedidos
    .filter((p) => p.estado_nombre !== 'cancelado')
    .reduce((a, p) => a + Number(p.total_pedido), 0);

  return (
    <div style={{ background: '#f5f2ed', minHeight: '100dvh', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '48px 20px 24px',
        borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px',
      }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '1.6rem', color: '#fff', marginBottom: '4px' }}>
          Mis Pedidos<span style={{ color: '#ff4f1f' }}>.</span>
        </h1>
        <p style={{ color: '#888', fontSize: '0.8rem' }}>
          {pedidos.length} pedidos en esta sesión
        </p>

        {/* Total acumulado */}
        {pedidos.length > 0 && (
          <div style={{
            marginTop: '16px', background: 'rgba(255,255,255,0.06)',
            borderRadius: '14px', padding: '14px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#aaa', fontSize: '0.82rem' }}>
              Total consumido
            </span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '1.3rem', color: '#ff4f1f' }}>
              ${totalConsumo.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '20px' }}>
        {!sesionId ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1.1rem', color: '#1a1a1a', marginBottom: '8px' }}>
              Sin sesión activa
            </h3>
            <p style={{ color: '#888', fontSize: '0.85rem' }}>
              Escanea el QR de tu mesa para ver tus pedidos
            </p>
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
            Cargando pedidos...
          </div>
        ) : pedidos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🍽️</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1.1rem', color: '#1a1a1a', marginBottom: '8px' }}>
              Aún no has pedido nada
            </h3>
            <p style={{ color: '#888', fontSize: '0.85rem' }}>
              Explora el menú y haz tu primer pedido
            </p>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onConfirmar={confirmar}
              onCancelar={cancelar}
            />
          ))
        )}
      </div>
    </div>
  );
}