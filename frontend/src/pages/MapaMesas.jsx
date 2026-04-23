import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMapaMesas, escanearQR } from '../api/mesas';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { QrCode, Users, MapPin, CheckCircle } from 'lucide-react';

const COLOR_ESTADO = {
  disponible: { bg: '#27ae60', light: '#e8f8f0', text: '#1a5c2e', label: 'Disponible' },
  ocupada:    { bg: '#e74c3c', light: '#fdeaea', text: '#7b1c1c', label: 'Ocupada'    },
  reservada:  { bg: '#f39c12', light: '#fef6e4', text: '#7b5000', label: 'Reservada'  },
};

function MesaChip({ mesa, seleccionada, onClick }) {
  const estado = COLOR_ESTADO[mesa.estado_nombre] || COLOR_ESTADO.disponible;
  return (
    <div
      onClick={() => onClick(mesa)}
      style={{
        position: 'absolute',
        left:  `${mesa.coord_x}%`,
        top:   `${mesa.coord_y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: seleccionada ? 10 : 1,
        transition: 'transform 0.2s',
      }}
    >
      <div style={{
        width: seleccionada ? '64px' : '52px',
        height: seleccionada ? '64px' : '52px',
        borderRadius: '16px',
        background: seleccionada ? estado.bg : estado.light,
        border: `2.5px solid ${estado.bg}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: seleccionada
          ? `0 4px 20px ${estado.bg}66`
          : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.25s',
      }}>
        <span style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: seleccionada ? '1rem' : '0.85rem',
          color: seleccionada ? '#fff' : estado.text,
        }}>
          {mesa.numero}
        </span>
        <span style={{ fontSize: '9px', fontWeight: 600,
          color: seleccionada ? 'rgba(255,255,255,0.8)' : estado.text,
          letterSpacing: '0.3px' }}>
          {mesa.capacidad}p
        </span>
      </div>
      {seleccionada && (
        <div style={{
          position: 'absolute', top: '-8px', right: '-8px',
          background: estado.bg, borderRadius: '99px',
          width: '20px', height: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #fff',
        }}>
          <CheckCircle size={12} color="#fff" />
        </div>
      )}
    </div>
  );
}

export default function MapaMesas() {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [tokenQR, setTokenQR]   = useState('');
  const [modoQR,  setModoQR]    = useState(false);
  const setSesion  = useAuthStore((s) => s.setSesion);
  const sesionId   = useAuthStore((s) => s.sesionId);
  const queryClient = useQueryClient();

  const { data: mesas = [], isLoading } = useQuery({
    queryKey: ['mesas-mapa'],
    queryFn:  () => getMapaMesas().then((r) => r.data),
    refetchInterval: 15000, // actualiza cada 15 seg
  });

  const { mutate: unirseQR, isPending } = useMutation({
    mutationFn: escanearQR,
    onSuccess: (res) => {
      setSesion(res.data.sesion_id);
      toast.success(`¡Bienvenido a la Mesa ${res.data.mesa_numero}! 🪑`);
      queryClient.invalidateQueries(['mesas-mapa']);
      setModoQR(false);
      setTokenQR('');
    },
    onError: () => toast.error('QR inválido o inactivo'),
  });

  const conteo = {
    disponible: mesas.filter((m) => m.estado_nombre === 'disponible').length,
    ocupada:    mesas.filter((m) => m.estado_nombre === 'ocupada').length,
    reservada:  mesas.filter((m) => m.estado_nombre === 'reservada').length,
  };

  return (
    <div style={{ background: '#f5f2ed', minHeight: '100dvh', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '48px 20px 24px',
        borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px',
      }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '1.6rem', color: '#fff', marginBottom: '4px' }}>
          Mapa de Mesas<span style={{ color: '#ff4f1f' }}>.</span>
        </h1>
        <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '16px' }}>
          {mesas.length} mesas en total · Actualizado en tiempo real
        </p>

        {/* Leyenda */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {Object.entries(COLOR_ESTADO).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px',
                borderRadius: '50%', background: val.bg }} />
              <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 600 }}>
                {val.label} ({conteo[key] || 0})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sesión activa */}
      {sesionId && (
        <div style={{
          margin: '16px 20px 0',
          background: '#e8f8f0', borderRadius: '14px',
          padding: '12px 16px', display: 'flex',
          alignItems: 'center', gap: '10px',
          border: '1px solid #27ae60',
        }}>
          <CheckCircle size={18} color="#27ae60" />
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a5c2e' }}>
              Estás en una sesión activa
            </p>
            <p style={{ fontSize: '0.75rem', color: '#27ae60' }}>
              Sesión #{sesionId}
            </p>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{
          position: 'relative', background: '#fff',
          borderRadius: '20px', overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          height: '340px',
          backgroundImage: `
            linear-gradient(rgba(229,224,216,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(229,224,216,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}>
          {/* Etiqueta de sección */}
          <div style={{
            position: 'absolute', top: '12px', left: '12px',
            background: 'rgba(26,26,26,0.06)', borderRadius: '8px',
            padding: '4px 10px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#888' }}>
              🪑 Sala Principal
            </span>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center',
              justifyContent: 'center', height: '100%', color: '#888' }}>
              Cargando mesas...
            </div>
          ) : (
            mesas.map((mesa) => (
              <MesaChip
                key={mesa.id}
                mesa={mesa}
                seleccionada={mesaSeleccionada?.id === mesa.id}
                onClick={(m) => setMesaSeleccionada(
                  mesaSeleccionada?.id === m.id ? null : m
                )}
              />
            ))
          )}
        </div>
      </div>

      {/* Detalle de mesa seleccionada */}
      {mesaSeleccionada && (
        <div style={{ margin: '16px 20px 0' }}>
          <div style={{
            background: '#fff', borderRadius: '20px',
            padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            {(() => {
              const estado = COLOR_ESTADO[mesaSeleccionada.estado_nombre];
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                        fontSize: '1.2rem', color: '#1a1a1a' }}>
                        Mesa {mesaSeleccionada.numero}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center',
                        gap: '6px', marginTop: '4px' }}>
                        <Users size={14} color="#888" />
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>
                          {mesaSeleccionada.capacidad} personas
                        </span>
                      </div>
                    </div>
                    <div style={{
                      background: estado.light,
                      border: `1.5px solid ${estado.bg}`,
                      borderRadius: '99px', padding: '6px 14px',
                    }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700,
                        color: estado.text }}>
                        {estado.label}
                      </span>
                    </div>
                  </div>

                  {mesaSeleccionada.estado_nombre === 'disponible' && (
                    <p style={{ fontSize: '0.8rem', color: '#888',
                      marginBottom: '14px' }}>
                      Esta mesa está disponible. Acércate y escanea el QR
                      para unirte a ella.
                    </p>
                  )}
                  {mesaSeleccionada.estado_nombre === 'ocupada' && (
                    <p style={{ fontSize: '0.8rem', color: '#888',
                      marginBottom: '14px' }}>
                      Esta mesa está ocupada actualmente.
                    </p>
                  )}
                  {mesaSeleccionada.estado_nombre === 'reservada' && (
                    <p style={{ fontSize: '0.8rem', color: '#888',
                      marginBottom: '14px' }}>
                      Esta mesa tiene una reserva confirmada.
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Sección QR */}
      <div style={{ margin: '16px 20px 0' }}>
        {!modoQR ? (
          <button onClick={() => setModoQR(true)} style={{
            width: '100%', padding: '18px',
            background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: '16px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
            cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>
            <QrCode size={20} />
            Escanear QR de mi mesa
          </button>
        ) : (
          <div style={{
            background: '#fff', borderRadius: '20px',
            padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1rem', color: '#1a1a1a', marginBottom: '6px' }}>
              Ingresar código QR
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '14px' }}>
              Escanea el QR con tu cámara o ingresa el código manualmente:
            </p>
            <input
              value={tokenQR}
              onChange={(e) => setTokenQR(e.target.value)}
              placeholder="Código del QR..."
              style={{
                width: '100%', padding: '14px',
                border: '1.5px solid #e5e0d8', borderRadius: '12px',
                fontSize: '0.9rem', fontFamily: 'Plus Jakarta Sans, sans-serif',
                outline: 'none', marginBottom: '12px',
                background: '#f5f2ed',
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModoQR(false)} style={{
                flex: 1, padding: '13px', background: '#f5f2ed',
                border: 'none', borderRadius: '12px', fontSize: '0.85rem',
                fontWeight: 600, cursor: 'pointer', color: '#888',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
                Cancelar
              </button>
              <button
                onClick={() => tokenQR.trim() && unirseQR(tokenQR.trim())}
                disabled={isPending || !tokenQR.trim()}
                style={{
                  flex: 2, padding: '13px',
                  background: isPending || !tokenQR.trim() ? '#ccc' : '#ff4f1f',
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontSize: '0.85rem', fontWeight: 700,
                  cursor: isPending || !tokenQR.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>
                {isPending ? 'Uniéndose...' : 'Unirse a la mesa'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info de uso */}
      <div style={{ margin: '16px 20px 0',
        background: '#ffe8df', borderRadius: '14px',
        padding: '14px 16px', display: 'flex', gap: '10px',
        alignItems: 'flex-start' }}>
        <MapPin size={16} color="#ff4f1f" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.82rem',
            color: '#cc3e18', marginBottom: '4px' }}>
            ¿Cómo funciona?
          </p>
          <p style={{ fontSize: '0.78rem', color: '#cc3e18', lineHeight: 1.5 }}>
            Cada mesa tiene un código QR físico. Escanéalo con la cámara de tu
            teléfono o ingresa el código para unirte a la sesión de esa mesa y
            poder hacer tu pedido.
          </p>
        </div>
      </div>
    </div>
  );
}