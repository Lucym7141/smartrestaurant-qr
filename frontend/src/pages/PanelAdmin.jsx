import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import {
  ChefHat, Clock, CheckCircle, Truck, LogOut,
  RefreshCw, CreditCard, Users, Unlock, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// ── API ───────────────────────────────────────────────────────────────────────
const getSesionesActivas  = ()                => api.get('/mesas/mapa/');
const getPedidosMesa      = (sesionId)        => api.get(`/pedidos/mesa/${sesionId}/`);
const getResumenCuenta    = (sesionId)        => api.get(`/pagos/mesa/${sesionId}/resumen/`);
const getReservasMesa     = (mesaId)          => api.get(`/reservas/todas/?mesa_id=${mesaId}`);
const cambiarEstadoAPI    = ({ id, estado })  => api.patch(`/pedidos/${id}/estado/`, { estado });
const confirmarPagoAPI    = (pagoId)          => api.patch(`/pagos/${pagoId}/confirmar/`, {});
const liberarMesaAPI      = (sesionId)        => api.post(`/mesas/sesion/${sesionId}/liberar/`, {});
const marcarPagadoAPI     = (detalleId)       => api.patch(`/pagos/detalle/${detalleId}/marcar-pagado/`, {});
const eliminarReservaAPI  = (reservaId)       => api.delete(`/reservas/${reservaId}/eliminar/`);

const ESTADO_CONFIG = {
  pendiente:      { color: '#f39c12', bg: '#fef6e4', label: 'Pendiente',      icon: Clock       },
  en_preparacion: { color: '#2e75b6', bg: '#e8f0fb', label: 'En preparación', icon: ChefHat     },
  listo:          { color: '#27ae60', bg: '#e8f8f0', label: 'Listo',          icon: Truck       },
  entregado:      { color: '#888',    bg: '#f5f5f5', label: 'Entregado',      icon: CheckCircle },
};

const SIGUIENTE_ESTADO = {
  pendiente:      'en_preparacion',
  en_preparacion: 'listo',
};

// ── PedidoCard ────────────────────────────────────────────────────────────────
function PedidoCard({ pedido, onCambiarEstado }) {
  const config    = ESTADO_CONFIG[pedido.estado_nombre] || ESTADO_CONFIG.pendiente;
  const Icon      = config.icon;
  const sigEstado = SIGUIENTE_ESTADO[pedido.estado_nombre];

  return (
    <div style={{
      background: '#fff', borderRadius: '20px',
      overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      marginBottom: '14px',
    }}>
      <div style={{
        background: config.bg, padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `2px solid ${config.color}22`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: config.color + '20', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={15} color={config.color} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: config.color }}>
            {config.label}
          </span>
        </div>
        <span style={{
          fontSize: '0.72rem', color: '#bbb', fontWeight: 600,
          background: '#fff', borderRadius: '99px', padding: '3px 10px',
        }}>
          {new Date(pedido.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <h3 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '1rem', color: '#1a1a1a', marginBottom: '12px',
        }}>
          {pedido.nombre_pedido}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {pedido.detalles?.map((detalle, i) => (
            <div key={i} style={{ background: '#fafaf9', borderRadius: '12px', padding: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a' }}>
                ×{detalle.cantidad} {detalle.plato_nombre}
                {detalle.variante_nombre && (
                  <span style={{ color: '#aaa', fontWeight: 400 }}> · {detalle.variante_nombre}</span>
                )}
              </span>
              {detalle.adiciones?.length > 0 && (
                <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {detalle.adiciones.map((ad, j) => (
                    <span key={j} style={{
                      fontSize: '0.72rem', color: '#ff4f1f',
                      background: '#fff5f2', borderRadius: '99px', padding: '2px 8px',
                    }}>
                      + {ad.adicion_nombre}
                    </span>
                  ))}
                </div>
              )}
              {detalle.ingredientes_removidos?.length > 0 && (
                <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {detalle.ingredientes_removidos.map((ing, j) => (
                    <span key={j} style={{
                      fontSize: '0.72rem', color: '#e74c3c',
                      background: '#fdeaea', borderRadius: '99px', padding: '2px 8px',
                    }}>
                      Sin {ing.ingrediente_nombre}
                    </span>
                  ))}
                </div>
              )}
              {detalle.notas && (
                <p style={{ fontSize: '0.72rem', color: '#bbb', fontStyle: 'italic', marginTop: '6px' }}>
                  "{detalle.notas}"
                </p>
              )}
              {detalle.alergia_confirmada && (
                <span style={{
                  fontSize: '0.7rem', color: '#f39c12', background: '#fff9e6',
                  borderRadius: '99px', padding: '2px 8px', marginTop: '4px', display: 'inline-block',
                }}>
                  ⚠️ Alergia confirmada
                </span>
              )}
            </div>
          ))}
        </div>

        {sigEstado && (
          <button
            onClick={() => onCambiarEstado({ id: pedido.id, estado: sigEstado })}
            style={{
              width: '100%', padding: '13px',
              background: sigEstado === 'en_preparacion' ? '#2e75b6' : '#27ae60',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            {sigEstado === 'en_preparacion' ? '👨‍🍳 Iniciar preparación' : '✅ Marcar como listo'}
          </button>
        )}
        {pedido.estado_nombre === 'listo' && (
          <div style={{
            padding: '10px 14px', background: '#e8f8f0', borderRadius: '12px',
            textAlign: 'center', fontSize: '0.82rem', fontWeight: 600, color: '#27ae60',
          }}>
            ✅ Listo — esperando confirmación del cliente
          </div>
        )}
      </div>
    </div>
  );
}

// ── MesaCard ──────────────────────────────────────────────────────────────────
function MesaCard({ mesa, onSelectMesa, seleccionada }) {
  const color = mesa.estado_nombre === 'ocupada' ? '#ff4f1f'
    : mesa.estado_nombre === 'reservada' ? '#f39c12' : '#27ae60';

  return (
    <div
      onClick={() => onSelectMesa(mesa)}
      style={{
        background: seleccionada ? '#1a1a1a' : '#fff',
        borderRadius: '16px', padding: '16px', cursor: 'pointer',
        border: `2px solid ${seleccionada ? '#ff4f1f' : color + '44'}`,
        transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '8px',
      }}>
        <span style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '1.2rem', color: seleccionada ? '#fff' : '#1a1a1a',
        }}>
          Mesa {mesa.numero}
        </span>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, color,
          background: color + '15', borderRadius: '99px', padding: '3px 10px',
        }}>
          {mesa.estado_nombre}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Users size={13} color={seleccionada ? '#666' : '#aaa'} />
        <span style={{ fontSize: '0.75rem', color: seleccionada ? '#666' : '#aaa' }}>
          {mesa.capacidad} personas · {mesa.ubicacion}
        </span>
      </div>
    </div>
  );
}

// ── PanelMesa ─────────────────────────────────────────────────────────────────
function PanelMesa({ mesa, onClose }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('pedidos');
  const sesionId = mesa.sesion_activa_id;
  const esReservada = mesa.estado_nombre === 'reservada';

  const { data: pedidos = [], isLoading: loadingPedidos } = useQuery({
    queryKey: ['panel-pedidos-mesa', sesionId],
    queryFn:  () => sesionId ? getPedidosMesa(sesionId).then(r => r.data) : [],
    enabled:  !!sesionId,
    refetchInterval: 8000,
  });

  const { data: resumen, isLoading: loadingResumen } = useQuery({
    queryKey: ['panel-resumen-mesa', sesionId],
    queryFn:  () => sesionId ? getResumenCuenta(sesionId).then(r => r.data) : null,
    enabled:  !!sesionId && tab === 'cuenta',
  });

  const { data: reservas = [], isLoading: loadingReservas } = useQuery({
    queryKey: ['panel-reservas-mesa', mesa.id],
    queryFn:  () => getReservasMesa(mesa.id).then(r =>
      r.data.filter(rv => ['pendiente', 'confirmada'].includes(rv.estado_nombre))
    ),
    enabled: esReservada,
  });

  const { mutate: cambiarEst } = useMutation({
    mutationFn: cambiarEstadoAPI,
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries(['panel-pedidos-mesa', sesionId]);
    },
    onError: () => toast.error('Error al cambiar estado'),
  });

  const { mutate: confirmarPago } = useMutation({
    mutationFn: () => confirmarPagoAPI(resumen?.pago?.id),
    onSuccess: () => {
      toast.success('Pago confirmado');
      queryClient.invalidateQueries(['panel-resumen-mesa', sesionId]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al confirmar pago'),
  });

  const { mutate: liberarMesa, isPending: liberando } = useMutation({
    mutationFn: () => liberarMesaAPI(sesionId),
    onSuccess: () => {
      toast.success(`Mesa ${mesa.numero} liberada ✅`);
      queryClient.invalidateQueries(['mesas-panel']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al liberar mesa'),
  });

  const { mutate: eliminarReserva, isPending: eliminando } = useMutation({
    mutationFn: (reservaId) => eliminarReservaAPI(reservaId),
    onSuccess: () => {
      toast.success(`Reserva eliminada y Mesa ${mesa.numero} liberada ✅`);
      queryClient.invalidateQueries(['mesas-panel']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al eliminar reserva'),
  });

  const { mutate: marcarPagado } = useMutation({
    mutationFn: marcarPagadoAPI,
    onSuccess: () => {
      toast.success('Marcado como pagado');
      queryClient.invalidateQueries(['panel-resumen-mesa', sesionId]);
    },
  });

  // ── Mesa reservada sin sesión ─────────────────────────────────────────────
  if (esReservada && !sesionId) {
    return (
      <div style={{
        background: '#fff', borderRadius: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', marginTop: '14px',
      }}>
        <div style={{
          background: '#1a1a1a', padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
              Mesa {mesa.numero}
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#f39c12' }}>Mesa reservada</p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none',
            borderRadius: '10px', padding: '8px 12px',
            color: '#aaa', fontSize: '0.8rem', cursor: 'pointer',
          }}>
            Cerrar
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {loadingReservas ? (
            <p style={{ textAlign: 'center', color: '#aaa' }}>Cargando reservas...</p>
          ) : reservas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '16px' }}>
                No hay reservas activas para esta mesa
              </p>
              <button
                onClick={() => {
                  // Liberar mesa directo cambiando estado en BD via endpoint especial
                  api.post(`/mesas/${mesa.id}/liberar-directo/`, {})
                    .then(() => {
                      toast.success(`Mesa ${mesa.numero} liberada ✅`);
                      queryClient.invalidateQueries(['mesas-panel']);
                      onClose();
                    })
                    .catch(() => toast.error('Error al liberar mesa'));
                }}
                style={{
                  background: '#27ae60', color: '#fff', border: 'none',
                  borderRadius: '12px', padding: '12px 24px',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto',
                }}
              >
                <Unlock size={16} /> Liberar mesa
              </button>
            </div>
          ) : (
            <>
              <p style={{
                fontSize: '0.75rem', fontWeight: 700, color: '#aaa',
                marginBottom: '12px', letterSpacing: '0.5px',
              }}>
                RESERVAS ACTIVAS
              </p>
              {reservas.map((rv) => (
                <div key={rv.id} style={{
                  background: '#fff9e6', borderRadius: '16px', padding: '16px',
                  marginBottom: '10px', border: '1px solid #f39c12',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a', marginBottom: '4px' }}>
                        {rv.usuario_nombre || 'Cliente'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>
                        {rv.num_personas} personas · {new Date(rv.fecha_reserva).toLocaleString('es-CO', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      {rv.notas && (
                        <p style={{ fontSize: '0.72rem', color: '#aaa', fontStyle: 'italic' }}>
                          "{rv.notas}"
                        </p>
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, color: '#f39c12',
                      background: '#f39c1220', borderRadius: '99px', padding: '3px 10px',
                    }}>
                      {rv.estado_nombre}
                    </span>
                  </div>
                  <button
                    onClick={() => eliminarReserva(rv.id)}
                    disabled={eliminando}
                    style={{
                      marginTop: '12px', width: '100%', padding: '11px',
                      background: eliminando ? '#ccc' : '#e74c3c',
                      color: '#fff', border: 'none', borderRadius: '10px',
                      fontSize: '0.82rem', fontWeight: 700, cursor: eliminando ? 'not-allowed' : 'pointer',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    <Trash2 size={15} />
                    {eliminando ? 'Eliminando...' : 'Eliminar reserva y liberar mesa'}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Mesa sin sesión (libre) ───────────────────────────────────────────────
  if (!sesionId) return (
    <div style={{
      background: '#fff', borderRadius: '20px', padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', textAlign: 'center', marginTop: '14px',
    }}>
      <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Mesa sin sesión activa</p>
    </div>
  );

  return (
    <div style={{
      background: '#fff', borderRadius: '20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', marginTop: '14px',
    }}>
      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
            Mesa {mesa.numero}
          </h3>
          <p style={{ fontSize: '0.72rem', color: '#555' }}>
            {pedidos.length} pedidos · Sesión #{sesionId}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => liberarMesa()}
            disabled={liberando}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: liberando ? '#555' : '#27ae60',
              border: 'none', borderRadius: '10px', padding: '8px 12px',
              color: '#fff', fontSize: '0.78rem', fontWeight: 700,
              cursor: liberando ? 'not-allowed' : 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            <Unlock size={14} />
            {liberando ? 'Liberando...' : 'Liberar'}
          </button>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none',
            borderRadius: '10px', padding: '8px 12px',
            color: '#aaa', fontSize: '0.8rem', cursor: 'pointer',
          }}>
            Cerrar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#f5f2ed', padding: '6px', gap: '4px' }}>
        {[
          { key: 'pedidos', label: `Pedidos (${pedidos.filter(p => ['pendiente','en_preparacion','listo'].includes(p.estado_nombre)).length})` },
          { key: 'cuenta',  label: 'Cuenta y pago' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
            background: tab === key ? '#fff' : 'transparent',
            color: tab === key ? '#1a1a1a' : '#aaa',
            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: tab === key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s',
          }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {tab === 'pedidos' ? (
          <>
            {loadingPedidos ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>Cargando...</p>
            ) : pedidos.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: '20px', fontSize: '0.85rem' }}>
                Sin pedidos en esta mesa
              </p>
            ) : (
              pedidos.map(p => (
                <PedidoCard key={p.id} pedido={p} onCambiarEstado={cambiarEst} />
              ))
            )}
          </>
        ) : (
          <>
            {loadingResumen ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>Cargando cuenta...</p>
            ) : !resumen ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: '20px', fontSize: '0.85rem' }}>
                Sin datos de cuenta
              </p>
            ) : (
              <>
                <div style={{
                  background: '#1a1a1a', borderRadius: '16px',
                  padding: '20px', marginBottom: '14px', textAlign: 'center',
                }}>
                  <p style={{ color: '#555', fontSize: '0.72rem', fontWeight: 600, marginBottom: '6px' }}>
                    TOTAL MESA
                  </p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2.5rem', color: '#ff4f1f' }}>
                    ${Number(resumen.total_general).toLocaleString()}
                  </p>
                </div>

                {resumen.pago?.detalles?.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#aaa', marginBottom: '10px', letterSpacing: '0.5px' }}>
                      DESGLOSE POR PERSONA
                    </p>
                    {resumen.pago.detalles.map((d, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px', background: d.pagado ? '#e8f8f0' : '#fafaf9',
                        borderRadius: '12px', marginBottom: '8px',
                        border: `1px solid ${d.pagado ? '#27ae60' : '#f0ede8'}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '10px',
                            background: '#f0ede8', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#888',
                          }}>
                            {d.usuario_nombre?.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a' }}>
                            {d.usuario_nombre}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#1a1a1a' }}>
                            ${Number(d.monto).toLocaleString()}
                          </span>
                          {d.pagado ? (
                            <CheckCircle size={16} color="#27ae60" />
                          ) : (
                            <button onClick={() => marcarPagado(d.id)} style={{
                              background: '#ff4f1f', color: '#fff', border: 'none',
                              borderRadius: '8px', padding: '5px 10px',
                              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                            }}>
                              Cobrar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {resumen.pago && !resumen.pago.confirmado_por_mesero && (
                    <button onClick={() => confirmarPago()} style={{
                      width: '100%', padding: '14px',
                      background: '#ff4f1f', color: '#fff', border: 'none',
                      borderRadius: '14px', fontSize: '0.88rem', fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: '0 4px 14px rgba(255,79,31,0.35)',
                    }}>
                      <CreditCard size={17} /> Confirmar pago
                    </button>
                  )}
                  <button
                    onClick={() => liberarMesa()}
                    disabled={liberando}
                    style={{
                      width: '100%', padding: '14px',
                      background: liberando ? '#ccc' : '#27ae60', color: '#fff', border: 'none',
                      borderRadius: '14px', fontSize: '0.88rem', fontWeight: 700,
                      cursor: liberando ? 'not-allowed' : 'pointer',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: '0 4px 14px rgba(39,174,96,0.35)',
                    }}
                  >
                    <Unlock size={17} /> Liberar mesa
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Panel principal ───────────────────────────────────────────────────────────
export default function PanelAdmin() {
  const navigate    = useNavigate();
  const logout      = useAuthStore((s) => s.logout);
  const usuario     = useAuthStore((s) => s.usuario);
  const rol         = useAuthStore((s) => s.rol);
  const queryClient = useQueryClient();
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  const { data: mesas = [], isLoading, refetch } = useQuery({
    queryKey: ['mesas-panel'],
    queryFn:  () => getSesionesActivas().then(r => r.data),
    refetchInterval: 15000,
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  const mesasOcupadas    = mesas.filter(m => m.estado_nombre === 'ocupada');
  const mesasDisponibles = mesas.filter(m => m.estado_nombre === 'libre');
  const mesasReservadas  = mesas.filter(m => m.estado_nombre === 'reservada');

  return (
    <div style={{
      background: '#f5f2ed', minHeight: '100dvh',
      paddingBottom: '40px', fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      <div style={{
        background: '#1a1a1a', padding: '52px 20px 24px',
        borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#555', fontSize: '0.75rem', marginBottom: '4px' }}>
              Panel de {rol || 'administración'}
            </p>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.8rem', color: '#fff', letterSpacing: '-0.5px' }}>
              {usuario}<span style={{ color: '#ff4f1f' }}>.</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { refetch(); queryClient.invalidateQueries(); }} style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '10px', cursor: 'pointer', display: 'flex',
            }}>
              <RefreshCw size={16} color="#aaa" />
            </button>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '10px 14px', cursor: 'pointer',
              color: '#aaa', fontSize: '0.78rem', fontWeight: 600,
            }}>
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' }}>
          {[
            { label: 'Ocupadas',    count: mesasOcupadas.length,    color: '#ff4f1f' },
            { label: 'Reservadas',  count: mesasReservadas.length,  color: '#f39c12' },
            { label: 'Disponibles', count: mesasDisponibles.length, color: '#27ae60' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color }}>{count}</p>
              <p style={{ fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', marginBottom: '14px' }}>
          Selecciona una mesa
        </p>

        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>Cargando mesas...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {mesas.map(mesa => (
              <MesaCard
                key={mesa.id}
                mesa={mesa}
                seleccionada={mesaSeleccionada?.id === mesa.id}
                onSelectMesa={(m) => setMesaSeleccionada(mesaSeleccionada?.id === m.id ? null : m)}
              />
            ))}
          </div>
        )}

        {mesaSeleccionada && (
          <PanelMesa
            mesa={mesaSeleccionada}
            onClose={() => setMesaSeleccionada(null)}
          />
        )}
      </div>
    </div>
  );
}