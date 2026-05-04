import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { generarPago, getMiPago } from '../api/pagos';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { CreditCard, Banknote, Smartphone, User, Split, CheckCircle } from 'lucide-react';

const METODOS = [
  { key: 'efectivo',      label: 'Efectivo',      desc: 'Pago en caja',           icon: Banknote   },
  { key: 'tarjeta',       label: 'Tarjeta',        desc: 'Crédito o débito',       icon: CreditCard },
  { key: 'transferencia', label: 'Transferencia',  desc: 'Nequi, Daviplata, etc.', icon: Smartphone },
];

const DIVISIONES = [
  { key: 'individual',  label: 'Lo que pedí',   desc: 'Cada quien paga lo suyo', icon: User  },
  { key: 'igualitaria', label: 'Partes iguales', desc: 'Dividido entre todos',    icon: Split },
];

export default function Pago() {
  const sesionId = useAuthStore((s) => s.sesionId);
  const [metodo,   setMetodo]   = useState('efectivo');
  const [division, setDivision] = useState('individual');

  const { data: pagoExistente, refetch } = useQuery({
    queryKey: ['mi-pago', sesionId],
    queryFn:  () => getMiPago(sesionId).then((r) => r.data),
    enabled:  !!sesionId,
    retry:    false,
  });

  const { mutate: generarCuenta, isPending } = useMutation({
    mutationFn: generarPago,
    onSuccess: () => {
      toast.success('Cuenta generada correctamente');
      refetch();
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Error al generar la cuenta';
      toast.error(msg);
    },
  });

  const handleGenerar = () => {
    if (!sesionId) { toast.error('No tienes una sesión activa'); return; }
    generarCuenta({ sesion_id: sesionId, tipo_division: division, metodo_pago: metodo });
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
          Gestiona tu cuenta
        </p>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '2rem', color: '#fff', letterSpacing: '-0.5px' }}>
          Pagar Cuenta<span style={{ color: '#ff4f1f' }}>.</span>
        </h1>
      </div>

      <div style={{ padding: '20px' }}>

        {!pagoExistente ? (
          <>
            {/* Sin sesión */}
            {!sesionId && (
              <div style={{ background: '#fff9e6', borderRadius: '16px',
                padding: '16px', marginBottom: '20px',
                border: '1px solid #f39c12', display: 'flex',
                alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '1.5rem' }}>⚠️</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#856404' }}>
                    Sin sesión activa
                  </p>
                  <p style={{ fontSize: '0.73rem', color: '#9a7605' }}>
                    Escanea el QR de tu mesa para activar una sesión
                  </p>
                </div>
              </div>
            )}

            {/* División */}
            <div style={{ background: '#fff', borderRadius: '20px',
              padding: '20px', marginBottom: '14px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: '1rem', color: '#1a1a1a', marginBottom: '14px' }}>
                Tipo de división
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {DIVISIONES.map(({ key, label, desc, icon: Icon }) => (
                  <button key={key} onClick={() => setDivision(key)} style={{
                    padding: '16px', borderRadius: '16px', cursor: 'pointer',
                    background: division === key ? '#1a1a1a' : '#fafaf9',
                    border: `2px solid ${division === key ? '#1a1a1a' : '#f0ede8'}`,
                    textAlign: 'left', transition: 'all 0.2s',
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px',
                      background: division === key ? 'rgba(255,79,31,0.2)' : '#f0ede8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '10px' }}>
                      <Icon size={18} color={division === key ? '#ff4f1f' : '#888'} />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem',
                      color: division === key ? '#fff' : '#1a1a1a', marginBottom: '3px' }}>
                      {label}
                    </p>
                    <p style={{ fontSize: '0.72rem',
                      color: division === key ? '#888' : '#aaa' }}>
                      {desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Método de pago */}
            <div style={{ background: '#fff', borderRadius: '20px',
              padding: '20px', marginBottom: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: '1rem', color: '#1a1a1a', marginBottom: '14px' }}>
                Método de pago
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {METODOS.map(({ key, label, desc, icon: Icon }) => (
                  <button key={key} onClick={() => setMetodo(key)} style={{
                    padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                    background: metodo === key ? '#fff5f2' : '#fafaf9',
                    border: `1.5px solid ${metodo === key ? '#ff4f1f' : '#f0ede8'}`,
                    display: 'flex', alignItems: 'center', gap: '14px',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px',
                      background: metodo === key ? '#ff4f1f' : '#f0ede8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.2s' }}>
                      <Icon size={18} color={metodo === key ? '#fff' : '#888'} />
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.88rem',
                        color: metodo === key ? '#ff4f1f' : '#1a1a1a', marginBottom: '2px' }}>
                        {label}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: '#aaa' }}>{desc}</p>
                    </div>
                    {metodo === key && (
                      <CheckCircle size={18} color="#ff4f1f" style={{ flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleGenerar} disabled={isPending} style={{
              width: '100%', padding: '16px',
              background: isPending ? '#ccc' : '#ff4f1f',
              color: '#fff', border: 'none', borderRadius: '14px',
              fontSize: '0.88rem', fontWeight: 700,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              cursor: isPending ? 'not-allowed' : 'pointer',
              boxShadow: isPending ? 'none' : '0 4px 14px rgba(255,79,31,0.35)',
              transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => { if (!isPending) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {isPending ? 'Generando cuenta...' : 'Generar cuenta'}
            </button>
          </>
        ) : (
          /* Cuenta generada */
          <>
            {/* Mi parte */}
            <div style={{ background: '#1a1a1a', borderRadius: '24px',
              padding: '24px', marginBottom: '14px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: '#666',
                fontWeight: 600, marginBottom: '8px', letterSpacing: '1px' }}>
                MI PARTE A PAGAR
              </p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: '3rem', color: '#ff4f1f', letterSpacing: '-1px',
                marginBottom: '8px' }}>
                ${Number(pagoExistente.mi_monto).toLocaleString()}
              </p>
              <span style={{
                display: 'inline-block',
                background: pagoExistente.estado_nombre === 'completado'
                  ? 'rgba(39,174,96,0.2)' : 'rgba(243,156,18,0.2)',
                color: pagoExistente.estado_nombre === 'completado' ? '#27ae60' : '#f39c12',
                fontSize: '0.78rem', fontWeight: 700,
                borderRadius: '99px', padding: '5px 14px',
              }}>
                {pagoExistente.estado_nombre === 'completado' ? '✓ Pagado' : '⏳ Pendiente'}
              </span>
              {pagoExistente.yo_pague && (
                <p style={{ fontSize: '0.78rem', color: '#27ae60',
                  fontWeight: 700, marginTop: '10px' }}>
                  ✓ Ya pagaste
                </p>
              )}
            </div>

            {/* Desglose */}
            <div style={{ background: '#fff', borderRadius: '20px',
              padding: '20px', marginBottom: '14px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: '1rem', color: '#1a1a1a', marginBottom: '16px' }}>
                Resumen de cuenta
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px',
                marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  fontSize: '0.83rem' }}>
                  <span style={{ color: '#aaa' }}>Subtotal</span>
                  <span style={{ fontWeight: 600, color: '#1a1a1a' }}>
                    ${Number(pagoExistente.total).toLocaleString()}
                  </span>
                </div>
                {Number(pagoExistente.deposito_descontado) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.83rem' }}>
                    <span style={{ color: '#27ae60' }}>Descuento depósito</span>
                    <span style={{ color: '#27ae60', fontWeight: 600 }}>
                      -${Number(pagoExistente.deposito_descontado).toLocaleString()}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '12px 14px', background: '#fff5f2', borderRadius: '12px',
                  marginTop: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a' }}>
                    Total final
                  </span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: '1.1rem', color: '#ff4f1f' }}>
                    ${Number(pagoExistente.total_final).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Desglose por persona */}
              {pagoExistente.detalles?.length > 0 && (
                <>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700,
                    color: '#aaa', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    DESGLOSE POR PERSONA
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pagoExistente.detalles.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', padding: '10px 12px',
                        background: '#fafaf9', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px',
                            borderRadius: '10px', background: '#f0ede8',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '0.82rem',
                            fontWeight: 800, color: '#888' }}>
                            {d.usuario_nombre?.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a' }}>
                            {d.usuario_nombre}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'Syne, sans-serif',
                            fontWeight: 700, color: '#1a1a1a' }}>
                            ${Number(d.monto).toLocaleString()}
                          </span>
                          {d.pagado && <CheckCircle size={15} color="#27ae60" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Instrucción */}
            <div style={{ background: '#fff5f2', borderRadius: '16px',
              padding: '16px', display: 'flex', gap: '12px',
              alignItems: 'flex-start', border: '1px solid #ffd5c8' }}>
              <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>🧾</div>
              <p style={{ fontSize: '0.78rem', color: '#cc3e18', lineHeight: 1.6 }}>
                Muestra esta pantalla al mesero para confirmar tu pago.
                La mesa se liberará automáticamente cuando el mesero confirme.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}