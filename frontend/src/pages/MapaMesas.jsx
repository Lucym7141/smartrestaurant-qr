import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { getMapaMesas, escanearQR } from '../api/mesas';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { QrCode, Users, MapPin, CheckCircle, Info, X, LogOut } from 'lucide-react';

const COLOR_ESTADO = {
  libre:      { bg: '#27ae60', light: '#e8f8f0', text: '#1a5c2e', label: 'Libre'      },
  disponible: { bg: '#27ae60', light: '#e8f8f0', text: '#1a5c2e', label: 'Disponible' },
  ocupada:    { bg: '#e74c3c', light: '#fdeaea', text: '#7b1c1c', label: 'Ocupada'    },
  reservada:  { bg: '#f39c12', light: '#fef6e4', text: '#7b5000', label: 'Reservada'  },
};

function MesaChip({ mesa, seleccionada, onClick }) {
  const estado     = COLOR_ESTADO[mesa.estado_nombre] || COLOR_ESTADO.libre;
  const color      = seleccionada ? estado.bg : estado.bg + '99';
  const sillas     = mesa.capacidad || 4;
  const sillasArr  = Math.ceil(sillas / 2);
  const sillaAbajo = Math.floor(sillas / 2);

  return (
    <div
      onClick={() => onClick(mesa)}
      style={{
        position: 'absolute',
        left: `${mesa.coord_x}%`, top: `${mesa.coord_y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer', zIndex: seleccionada ? 10 : 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
    >
      <div style={{ display: 'flex', gap: '4px' }}>
        {Array.from({ length: sillasArr }).map((_, i) => (
          <div key={i} style={{
            width: '12px', height: '10px', borderRadius: '3px 3px 0 0',
            background: color, opacity: seleccionada ? 1 : 0.6, transition: 'all 0.25s',
          }} />
        ))}
      </div>
      <div style={{
        width: `${Math.max(52, sillasArr * 16)}px`, height: '36px',
        borderRadius: '10px',
        background: seleccionada ? estado.bg : '#fff',
        border: `2.5px solid ${estado.bg}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: seleccionada ? `0 4px 16px ${estado.bg}55` : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.25s', position: 'relative',
      }}>
        <span style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.82rem',
          color: seleccionada ? '#fff' : estado.text,
        }}>{mesa.numero}</span>
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
      <div style={{ display: 'flex', gap: '4px' }}>
        {Array.from({ length: sillaAbajo }).map((_, i) => (
          <div key={i} style={{
            width: '12px', height: '10px', borderRadius: '0 0 3px 3px',
            background: color, opacity: seleccionada ? 1 : 0.6, transition: 'all 0.25s',
          }} />
        ))}
      </div>
    </div>
  );
}

export default function MapaMesas() {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [modoScanner, setModoScanner]           = useState(false);
  const [autoEscaneando, setAutoEscaneando]     = useState(false);
  const [confirmandoSalir, setConfirmandoSalir] = useState(false);
  const scannerRef  = useRef(null);
  const scannerInst = useRef(null);

  const setSesion  = useAuthStore((s) => s.setSesion);
  const salirMesa  = useAuthStore((s) => s.salirMesa);
  const sesionId   = useAuthStore((s) => s.sesionId);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: mesas = [], isLoading } = useQuery({
    queryKey: ['mesas-mapa'],
    queryFn:  () => getMapaMesas().then((r) => r.data),
    refetchInterval: 15000,
  });

  const { mutate: unirseQR, isPending } = useMutation({
    mutationFn: escanearQR,
    onSuccess: (res) => {
      detenerScanner();
      setSesion(res.data.sesion_id);
      toast.success(`¡Bienvenido a la Mesa ${res.data.mesa_numero}! 🪑`);
      queryClient.invalidateQueries(['mesas-mapa']);
      setModoScanner(false);
      setAutoEscaneando(false);
      setSearchParams({});
    },
    onError: () => {
      toast.error('QR inválido o inactivo');
      setAutoEscaneando(false);
      setSearchParams({});
    },
  });

  // Auto-escanear si viene token en la URL
  useEffect(() => {
    const tokenUrl = searchParams.get('token');
    if (tokenUrl && !sesionId) {
      setAutoEscaneando(true);
      setTimeout(() => unirseQR(tokenUrl), 600);
    }
  }, []);

  // Iniciar/detener cámara según modoScanner
  useEffect(() => {
    if (modoScanner) iniciarScanner();
    return () => { detenerScanner(); };
  }, [modoScanner]);

  const iniciarScanner = async () => {
    if (!scannerRef.current) return;
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerInst.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          let token = decodedText;
          try {
            const url = new URL(decodedText);
            const t = url.searchParams.get('token');
            if (t) token = t;
          } catch {}
          detenerScanner();
          setModoScanner(false);
          unirseQR(token);
        },
        () => {}
      );
    } catch {
      toast.error('No se pudo acceder a la cámara. Verifica los permisos.');
      setModoScanner(false);
    }
  };

  const detenerScanner = async () => {
    if (scannerInst.current) {
      try {
        await scannerInst.current.stop();
        scannerInst.current.clear();
      } catch {}
      scannerInst.current = null;
    }
  };

  const cerrarScanner = () => {
    detenerScanner();
    setModoScanner(false);
  };

  const handleSalirMesa = () => {
    salirMesa();
    setConfirmandoSalir(false);
    queryClient.invalidateQueries(['mesas-mapa']);
    toast.success('Saliste de la mesa. ¡Hasta pronto! 👋');
  };

  const conteo = {
    libre:     mesas.filter((m) => m.estado_nombre === 'libre').length,
    ocupada:   mesas.filter((m) => m.estado_nombre === 'ocupada').length,
    reservada: mesas.filter((m) => m.estado_nombre === 'reservada').length,
  };

  if (autoEscaneando) {
    return (
      <div style={{
        background: '#f5f2ed', minHeight: '100dvh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '40px 20px',
      }}>
        <div style={{
          background: '#fff', borderRadius: '24px', padding: '40px 30px',
          textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
          maxWidth: '320px', width: '100%',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px',
            background: '#fff5f2', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <QrCode size={36} color="#ff4f1f" />
          </div>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '1.4rem', color: '#1a1a1a', marginBottom: '8px',
          }}>
            Abriendo tu mesa<span style={{ color: '#ff4f1f' }}>...</span>
          </h2>
          <p style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Verificando el QR y abriendo tu sesión.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#f5f2ed', minHeight: '100dvh',
      paddingBottom: '100px', fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>

      {/* Modal confirmación salir mesa */}
      {confirmandoSalir && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 1000, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '24px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '28px 24px',
            maxWidth: '320px', width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: '#fdeaea', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <LogOut size={24} color="#e74c3c" />
            </div>
            <h3 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: '1.1rem', color: '#1a1a1a',
              textAlign: 'center', marginBottom: '8px',
            }}>
              ¿Salir de la mesa?
            </h3>
            <p style={{
              fontSize: '0.82rem', color: '#aaa', textAlign: 'center',
              lineHeight: 1.6, marginBottom: '20px',
            }}>
              Tu sesión de usuario se mantiene activa. Solo saldrás de la mesa actual.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmandoSalir(false)}
                style={{
                  flex: 1, padding: '13px', background: '#f5f2ed',
                  border: 'none', borderRadius: '12px', fontSize: '0.85rem',
                  fontWeight: 600, cursor: 'pointer', color: '#888',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSalirMesa}
                style={{
                  flex: 1, padding: '13px', background: '#e74c3c',
                  border: 'none', borderRadius: '12px', fontSize: '0.85rem',
                  fontWeight: 700, cursor: 'pointer', color: '#fff',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal scanner cámara */}
      {modoScanner && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 1000, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <button onClick={cerrarScanner} style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: '99px', width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <X size={22} color="#fff" />
          </button>
          <p style={{
            color: '#fff', fontFamily: 'Syne, sans-serif',
            fontWeight: 700, fontSize: '1.1rem',
            marginBottom: '24px', textAlign: 'center',
          }}>
            Apunta al QR de tu mesa
          </p>
          <div style={{
            width: '100%', maxWidth: '320px',
            borderRadius: '20px', overflow: 'hidden',
            border: '3px solid #ff4f1f', background: '#000',
          }}>
            <div id="qr-reader" ref={scannerRef} style={{ width: '100%' }} />
          </div>
          <p style={{
            color: '#888', fontSize: '0.8rem',
            marginTop: '20px', textAlign: 'center',
          }}>
            Centra el código QR dentro del recuadro
          </p>
          {isPending && (
            <div style={{
              marginTop: '16px', background: '#ff4f1f',
              borderRadius: '12px', padding: '12px 24px',
              color: '#fff', fontWeight: 700, fontSize: '0.88rem',
            }}>
              Verificando mesa...
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '52px 20px 24px',
        borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px',
      }}>
        <p style={{ color: '#555', fontSize: '0.78rem', marginBottom: '4px' }}>
          {mesas.length} mesas · Tiempo real
        </p>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '2rem', color: '#fff', letterSpacing: '-0.5px', marginBottom: '16px',
        }}>
          Mapa de Mesas<span style={{ color: '#ff4f1f' }}>.</span>
        </h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { key: 'libre',     bg: '#27ae60', label: 'Libre' },
            { key: 'ocupada',   bg: '#e74c3c', label: 'Ocupada' },
            { key: 'reservada', bg: '#f39c12', label: 'Reservada' },
          ].map(({ key, bg, label }) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '99px', padding: '5px 12px',
            }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: bg }} />
              <span style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 600 }}>
                {label} · {conteo[key] || 0}
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
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#27ae6020', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CheckCircle size={18} color="#27ae60" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a5c2e' }}>
                Estás en una sesión activa
              </p>
              <p style={{ fontSize: '0.73rem', color: '#27ae60' }}>Sesión #{sesionId}</p>
            </div>
            {/* Botón salir mesa */}
            <button
              onClick={() => setConfirmandoSalir(true)}
              style={{
                background: '#fdeaea', border: '1px solid #e74c3c',
                borderRadius: '10px', padding: '8px 12px',
                display: 'flex', alignItems: 'center', gap: '6px',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <LogOut size={14} color="#e74c3c" />
              <span style={{
                fontSize: '0.75rem', fontWeight: 700, color: '#e74c3c',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
                Salir
              </span>
            </button>
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
            background: 'rgba(26,26,26,0.05)', borderRadius: '8px', padding: '4px 10px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#888' }}>
              🪑 Sala Principal
            </span>
          </div>
          {isLoading ? (
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', height: '100%',
              color: '#aaa', fontSize: '0.85rem',
            }}>
              Cargando mesas...
            </div>
          ) : (
            mesas.map((mesa) => (
              <MesaChip
                key={mesa.id}
                mesa={mesa}
                seleccionada={mesaSeleccionada?.id === mesa.id}
                onClick={(m) => setMesaSeleccionada(mesaSeleccionada?.id === m.id ? null : m)}
              />
            ))
          )}
        </div>

        {/* Detalle mesa seleccionada */}
        {mesaSeleccionada && (() => {
          const estado = COLOR_ESTADO[mesaSeleccionada.estado_nombre] || COLOR_ESTADO.libre;
          const msgs = {
            libre:     'Esta mesa está disponible. Escanea el QR para unirte.',
            disponible:'Esta mesa está disponible. Escanea el QR para unirte.',
            ocupada:   'Esta mesa está ocupada actualmente.',
            reservada: 'Esta mesa tiene una reserva confirmada.',
          };
          return (
            <div style={{
              background: '#fff', borderRadius: '20px',
              padding: '18px', marginBottom: '14px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              border: `1.5px solid ${estado.bg}33`,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '10px',
              }}>
                <div>
                  <h3 style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: '1.1rem', color: '#1a1a1a',
                  }}>
                    Mesa {mesaSeleccionada.numero}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
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
                  background: estado.light, border: `1.5px solid ${estado.bg}`,
                  borderRadius: '99px', padding: '5px 12px',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: estado.text }}>
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

        {/* Botón escanear */}
        {!sesionId && (
          <button
            onClick={() => setModoScanner(true)}
            disabled={isPending}
            style={{
              width: '100%', padding: '17px',
              background: '#ff4f1f', color: '#fff',
              border: 'none', borderRadius: '16px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '10px',
              cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              marginBottom: '14px',
              boxShadow: '0 4px 14px rgba(255,79,31,0.35)',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <QrCode size={19} />
            Escanear QR de mi mesa
          </button>
        )}

        {/* Info */}
        <div style={{
          background: '#fff5f2', borderRadius: '16px',
          padding: '14px 16px', display: 'flex', gap: '12px',
          alignItems: 'flex-start', border: '1px solid #ffd5c8',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: '#ff4f1f20', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Info size={15} color="#ff4f1f" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#cc3e18', marginBottom: '4px' }}>
              ¿Cómo funciona?
            </p>
            <p style={{ fontSize: '0.76rem', color: '#cc3e18', lineHeight: 1.6 }}>
              {sesionId
                ? 'Estás en una mesa activa. Puedes salir de la mesa sin cerrar tu sesión de usuario.'
                : 'Presiona el botón naranja, apunta la cámara al QR de tu mesa y la sesión se abrirá automáticamente.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}