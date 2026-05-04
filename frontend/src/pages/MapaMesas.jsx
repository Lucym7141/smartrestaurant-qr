import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMapaMesas, escanearQR } from '../api/mesas';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { QrCode, Users, MapPin, CheckCircle, Info } from 'lucide-react';

const COLOR_ESTADO = {
  disponible: { bg: '#27ae60', light: '#e8f8f0', text: '#1a5c2e', label: 'Disponible' },
  ocupada:    { bg: '#e74c3c', light: '#fdeaea', text: '#7b1c1c', label: 'Ocupada'    },
  reservada:  { bg: '#f39c12', light: '#fef6e4', text: '#7b5000', label: 'Reservada'  },
};

function Silla({ color, style }) {
  return (
    <div style={{
      width: '10px', height: '10px', borderRadius: '3px',
      background: color, opacity: 0.7,
      ...style,
    }} />
  );
}

function MesaChip({ mesa, seleccionada, onClick }) {
  const estado = COLOR_ESTADO[mesa.estado_nombre] || COLOR_ESTADO.disponible;
  const color  = seleccionada ? estado.bg : estado.bg + '99';
  const sillas = mesa.capacidad || 4;

  // Distribuir sillas: arriba, abajo, lados
  const sillasArriba  = Math.ceil(sillas / 2);
  const sillaAbajo    = Math.floor(sillas / 2);

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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
    >
      {/* Sillas arriba */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {Array.from({ length: sillasArriba }).map((_, i) => (
          <div key={i} style={{
            width: '12px', height: '10px', borderRadius: '3px 3px 0 0',
            background: color, opacity: seleccionada ? 1 : 0.6,
            transition: 'all 0.25s',
          }} />
        ))}
      </div>

      {/* Mesa */}
      <div style={{
        width: `${Math.max(52, sillasArriba * 16)}px`,
        height: '36px',
        borderRadius: '10px',
        background: seleccionada ? estado.bg : '#fff',
        border: `2.5px solid ${estado.bg}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: seleccionada
          ? `0 4px 16px ${estado.bg}55`
          : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.25s',
        position: 'relative',
      }}>
        <span style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '0.82rem',
          color: seleccionada ? '#fff' : estado.text,
        }}>
          {mesa.numero}
        </span>

        {/* Badge seleccionada */}
        {seleccionada && (
          <div style={{
            position: 'absolute', top: '-8px', right: '-8px',
            background: estado.bg, borderRadius: '99px',
            width: '18px', height: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            <CheckCircle size={10} color="#fff" />
          </div>
        )}
      </div>

      {/* Sillas abajo */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {Array.from({ length: sillaAbajo }).map((_, i) => (
          <div key={i} style={{
            width: '12px', height: '10px', borderRadius: '0 0 3px 3px',
            background: color, opacity: seleccionada ? 1 : 0.6,
            transition: 'all 0.25s',
          }} />
        ))}
      </div>
    </div>
  );
}

export default function MapaMesas() {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [tokenQR, setTokenQR] = useState('');
  const [modoQR,  setModoQR]  = useState(false);
  const setSesion   = useAuthStore((s) => s.setSesion);
  const sesionId    = useAuthStore((s) => s.sesionId);
  const queryClient = useQueryClient();

  const { data: mesas = [], isLoading } = useQuery({
    queryKey: ['mesas-mapa'],
    queryFn:  () => getMapaMesas().then((r) => r.data),
    refetchInterval: 15000,
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
    <div style={{ background: '#f5f2ed', minHeight: '100dvh',
      paddingBottom: '100px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '52px 20px 24px',
        borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px',
      }}>
        <p style={{ color: '#555', fontSize: '0.78rem', marginBottom: '4px' }}>
          {mesas.length} mesas · Tiempo real
        </p>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '2rem', color: '#fff', letterSpacing: '-0.5px',
          marginBottom: '16px' }}>
          Mapa de Mesas<span style={{ color: '#ff4f1f' }}>.</span>
        </h1>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Object.entries(COLOR_ESTADO).map(([key, val]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '99px', padding: '5px 12px',
            }}>
              <div style={{ width: '7px', height: '7px',
                borderRadius: '50%', background: val.bg }} />
              <span style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 600 }}>
                {val.label} · {conteo[key] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>

        {/* Sesión activa */}
        {sesionId && (
          <div style={{
            background: '#e8f8f0', borderRadius: '16px',
            padding: '14px 16px', marginBottom: '14px',
            display: 'flex', alignItems: 'center', gap: '12px',
            border: '1px solid #27ae60',
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px',
              background: '#27ae6020', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={18} color="#27ae60" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a5c2e' }}>
                Estás en una sesión activa
              </p>
              <p style={{ fontSize: '0.73rem', color: '#27ae60' }}>
                Sesión #{sesionId}
              </p>
            </div>
          </div>
        )}

        {/* Mapa */}
        <div style={{
          position: 'relative', background: '#fff',
          borderRadius: '20px', overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          height: '360px', marginBottom: '14px',
          backgroundImage: `
            linear-gradient(rgba(229,224,216,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(229,224,216,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}>
          <div style={{
            position: 'absolute', top: '12px', left: '12px',
            background: 'rgba(26,26,26,0.05)', borderRadius: '8px',
            padding: '4px 10px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#888' }}>
              🪑 Sala Principal
            </span>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center',
              justifyContent: 'center', height: '100%',
              color: '#aaa', fontSize: '0.85rem' }}>
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

        {/* Detalle mesa seleccionada */}
        {mesaSeleccionada && (() => {
          const estado = COLOR_ESTADO[mesaSeleccionada.estado_nombre] || COLOR_ESTADO.disponible;
          const msgs = {
            disponible: 'Esta mesa está disponible. Acércate y escanea el QR para unirte.',
            ocupada:    'Esta mesa está ocupada actualmente.',
            reservada:  'Esta mesa tiene una reserva confirmada.',
          };
          return (
            <div style={{ background: '#fff', borderRadius: '20px',
              padding: '18px', marginBottom: '14px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              border: `1.5px solid ${estado.bg}33` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: '1.1rem', color: '#1a1a1a' }}>
                    Mesa {mesaSeleccionada.numero}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center',
                    gap: '5px', marginTop: '3px' }}>
                    <Users size={13} color="#aaa" />
                    <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
                      {mesaSeleccionada.capacidad} personas
                    </span>
                    {mesaSeleccionada.ubicacion && (
                      <>
                        <span style={{ color: '#ddd' }}>·</span>
                        <MapPin size={13} color="#aaa" />
                        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
                          {mesaSeleccionada.ubicacion}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{
                  background: estado.light,
                  border: `1.5px solid ${estado.bg}`,
                  borderRadius: '99px', padding: '5px 12px',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700,
                    color: estado.text }}>
                    {estado.label}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#aaa', lineHeight: 1.5 }}>
                {msgs[mesaSeleccionada.estado_nombre] || ''}
              </p>
            </div>
          );
        })()}

        {/* Botón QR */}
        {!modoQR ? (
          <button onClick={() => setModoQR(true)} style={{
            width: '100%', padding: '17px',
            background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: '16px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
            cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            marginBottom: '14px', transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <QrCode size={19} />
            Escanear QR de mi mesa
          </button>
        ) : (
          <div style={{ background: '#fff', borderRadius: '20px',
            padding: '20px', marginBottom: '14px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '1rem', color: '#1a1a1a', marginBottom: '4px' }}>
              Ingresar código QR
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '14px' }}>
              Escanea el QR con tu cámara o ingresa el código manualmente
            </p>
            <input
              value={tokenQR}
              onChange={(e) => setTokenQR(e.target.value)}
              placeholder="Código del QR..."
              style={{
                width: '100%', padding: '13px 14px',
                border: '1.5px solid #e5e0d8', borderRadius: '12px',
                fontSize: '0.88rem', fontFamily: 'Plus Jakarta Sans, sans-serif',
                outline: 'none', marginBottom: '12px',
                background: '#fafaf9', color: '#1a1a1a',
                boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#ff4f1f'}
              onBlur={e => e.target.style.borderColor = '#e5e0d8'}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setModoQR(false); setTokenQR(''); }} style={{
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
                  background: isPending || !tokenQR.trim() ? '#e5e0d8' : '#ff4f1f',
                  color: isPending || !tokenQR.trim() ? '#aaa' : '#fff',
                  border: 'none', borderRadius: '12px',
                  fontSize: '0.85rem', fontWeight: 700,
                  cursor: isPending || !tokenQR.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  transition: 'all 0.2s',
                }}>
                {isPending ? 'Uniéndose...' : 'Unirse a la mesa'}
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <div style={{
          background: '#fff5f2', borderRadius: '16px',
          padding: '14px 16px', display: 'flex', gap: '12px',
          alignItems: 'flex-start', border: '1px solid #ffd5c8',
        }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px',
            background: '#ff4f1f20', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Info size={15} color="#ff4f1f" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.82rem',
              color: '#cc3e18', marginBottom: '4px' }}>
              ¿Cómo funciona?
            </p>
            <p style={{ fontSize: '0.76rem', color: '#cc3e18', lineHeight: 1.6 }}>
              Cada mesa tiene un código QR físico. Escanéalo con la cámara
              de tu teléfono o ingresa el código para unirte a la sesión
              y poder hacer tu pedido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}