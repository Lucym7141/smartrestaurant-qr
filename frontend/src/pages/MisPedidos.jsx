import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMisPedidos, confirmarRecepcion, cancelarPedido } from '../api/pedidos';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, ChefHat, Truck, XCircle } from 'lucide-react';

const ESTADO_CONFIG = {
  pendiente:       { icon: Clock,        color: '#f39c12', label: 'Pendiente',         bg: '#fef6e4' },
  en_preparacion:  { icon: ChefHat,      color: '#2e75b6', label: 'En preparación',    bg: '#e8f0fb' },
  listo:           { icon: Truck,        color: '#27ae60', label: '¡Listo! En camino', bg: '#e8f8f0' },
  entregado:       { icon: CheckCircle,  color: '#888',    label: 'Entregado',          bg: '#f5f5f5' },
};

function PedidoCard({ pedido, onConfirmar, onCancelar }) {
  const config = ESTADO_CONFIG[pedido.estado_nombre] || ESTADO_CONFIG.pendiente;
  const Icon   = config.icon;

  return (
    <div style={{
      background: '#fff', borderRadius: '20px',
      overflow: 'hidden', marginBottom: '14px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      {/* Barra de estado */}
      <div style={{
        background: config.bg, padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `2px solid ${config.color}22`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px',
            background: config.color + '20',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} color={config.color} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: config.color }}>
            {config.label}
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#bbb',
          background: '#fff', borderRadius: '99px', padding: '3px 10px',
          fontWeight: 600 }}>
          {new Date(pedido.fecha).toLocaleTimeString('es-CO', {
            hour: '2-digit', minute: '2-digit'
          })}
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '14px' }}>
          {pedido.nombre_pedido}
        </h3>

        {/* Ítems */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px',
          marginBottom: '14px' }}>
          {pedido.detalles?.map((detalle, i) => (
            <div key={i} style={{
              background: '#fafaf9', borderRadius: '12px', padding: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                marginBottom: detalle.adiciones?.length || detalle.notas ? '8px' : '0' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a' }}>
                  {detalle.plato_nombre}
                  {detalle.variante_nombre && (
                    <span style={{ color: '#aaa', fontWeight: 400 }}>
                      {' '}· {detalle.variante_nombre}
                    </span>
                  )}
                </span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  fontSize: '0.88rem', color: '#ff4f1f' }}>
                  ${Number(detalle.subtotal).toLocaleString()}
                </span>
              </div>

              {detalle.adiciones?.length > 0 && (
                <div style={{ borderTop: '1px solid #f0ede8', paddingTop: '6px' }}>
                  {detalle.adiciones.map((ad, j) => (
                    <div key={j} style={{ display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.73rem', color: '#999', marginBottom: '2px' }}>
                      <span>+ {ad.adicion_nombre} ×{ad.cantidad}</span>
                      <span style={{ color: '#ff4f1f' }}>
                        +${(Number(ad.precio_aplicado) * ad.cantidad).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {detalle.notas && (
                <p style={{ fontSize: '0.72rem', color: '#bbb',
                  fontStyle: 'italic', marginTop: '6px',
                  borderTop: '1px solid #f0ede8', paddingTop: '6px' }}>
                  "{detalle.notas}"
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '12px 14px',
          background: '#fff5f2', borderRadius: '12px',
          marginBottom: '14px' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>
            Total pedido
          </span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '1.1rem', color: '#ff4f1f' }}>
            ${Number(pedido.total_pedido).toLocaleString()}
          </span>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {pedido.estado_nombre === 'listo' && (
            <button onClick={() => onConfirmar(pedido.id)} style={{
              flex: 1, padding: '12px',
              background: '#27ae60', color: '#fff', border: 'none',
              borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '6px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: '0 4px 12px rgba(39,174,96,0.3)',
            }}>
              <CheckCircle size={15} />
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
              <XCircle size={15} />
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
    <div style={{ background: '#f5f2ed', minHeight: '100dvh',
      paddingBottom: '100px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '52px 20px 24px',
        borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px',
      }}>
        <p style={{ color: '#555', fontSize: '0.78rem', marginBottom: '4px' }}>
          {pedidos.length} pedidos en esta sesión
        </p>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '2rem', color: '#fff', letterSpacing: '-0.5px',
          marginBottom: pedidos.length > 0 ? '16px' : '0' }}>
          Mis Pedidos<span style={{ color: '#ff4f1f' }}>.</span>
        </h1>

        {pedidos.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ color: '#555', fontSize: '0.72rem',
                fontWeight: 600, marginBottom: '2px' }}>
                TOTAL CONSUMIDO
              </p>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: '1.6rem', color: '#ff4f1f' }}>
                ${totalConsumo.toLocaleString()}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#555', fontSize: '0.72rem',
                fontWeight: 600, marginBottom: '2px' }}>
                PEDIDOS
              </p>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: '1.6rem', color: '#fff' }}>
                {pedidos.length}
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '20px' }}>
        {!sesionId ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '22px',
              background: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '2rem' }}>
              📋
            </div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1.1rem', color: '#1a1a1a', marginBottom: '8px' }}>
              Sin sesión activa
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.82rem', lineHeight: 1.6 }}>
              Escanea el QR de tu mesa para ver tus pedidos
            </p>
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0',
            color: '#aaa', fontSize: '0.85rem' }}>
            Cargando pedidos...
          </div>
        ) : pedidos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '22px',
              background: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '2rem' }}>
              🍽️
            </div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1.1rem', color: '#1a1a1a', marginBottom: '8px' }}>
              Aún no has pedido nada
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.82rem', lineHeight: 1.6 }}>
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