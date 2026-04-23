import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { generarPago, getMiPago } from '../api/pagos';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { CreditCard, Banknote, Smartphone, Users, User, Split } from 'lucide-react';

const METODOS = [
  { key: 'efectivo',      label: 'Efectivo',      icon: Banknote    },
  { key: 'tarjeta',       label: 'Tarjeta',        icon: CreditCard  },
  { key: 'transferencia', label: 'Transferencia',  icon: Smartphone  },
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
    <div style={{ background: '#f5f2ed', minHeight: '100dvh', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a1a', padding: '48px 20px 24px',
        borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px',
      }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '1.6rem', color: '#fff', marginBottom: '4px' }}>
          Pagar Cuenta<span style={{ color: '#ff4f1f' }}>.</span>
        </h1>
        <p style={{ color: '#888', fontSize: '0.8rem' }}>
          Elige cómo quieres dividir el pago
        </p>
      </div>

      <div style={{ padding: '20px' }}>

        {!pagoExistente ? (
          <>
            {/* División */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: '1rem', color: '#1a1a1a', marginBottom: '12px' }}>
                Tipo de división
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {DIVISIONES.map(({ key, label, desc, icon: Icon }) => (
                  <button key={key} onClick={() => setDivision(key)} style={{
                    padding: '16px', borderRadius: '16px', cursor: 'pointer',
                    background: division === key ? '#1a1a1a' : '#fff',
                    border: `2px solid ${division === key ? '#1a1a1a' : '#e5e0d8'}`,
                    textAlign: 'left', transition: 'all 0.2s',
                  }}>
                    <Icon size={20} color={division === key ? '#ff4f1f' : '#888'}
                      style={{ marginBottom: '8px', display: 'block' }} />
                    <p style={{ fontWeight: 700, fontSize: '0.85rem',
                      color: division === key ? '#fff' : '#1a1a1a',
                      marginBottom: '2px' }}>
                      {label}
                    </p>
                    <p style={{ fontSize: '0.72rem',
                      color: division === key ? '#aaa' : '#888' }}>
                      {desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Método de pago */}
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: '1rem', color: '#1a1a1a', marginBottom: '12px' }}>
                Método de pago
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {METODOS.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setMetodo(key)} style={{
                    padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                    background: metodo === key ? '#ffe8df' : '#fff',
                    border: `1.5px solid ${metodo === key ? '#ff4f1f' : '#e5e0d8'}`,
                    display: 'flex', alignItems: 'center', gap: '12px',
                    transition: 'all 0.2s',
                  }}>
                    <Icon size={20} color={metodo === key ? '#ff4f1f' : '#888'} />
                    <span style={{ fontWeight: 600, fontSize: '0.88rem',
                      color: metodo === key ? '#ff4f1f' : '#1a1a1a' }}>
                      {label}
                    </span>
                    {metodo === key && (
                      <div style={{ marginLeft: 'auto', width: '20px', height: '20px',
                        borderRadius: '50%', background: '#ff4f1f',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleGenerar} disabled={isPending} style={{
              width: '100%', padding: '16px',
              background: isPending ? '#ccc' : '#ff4f1f',
              color: '#fff', border: 'none', borderRadius: '14px',
              fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}>
              {isPending ? 'GENERANDO CUENTA...' : 'GENERAR CUENTA'}
            </button>
          </>
        ) : (
          /* Cuenta ya generada */
          <div>
            <div style={{
              background: '#fff', borderRadius: '20px',
              padding: '20px', marginBottom: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                  fontSize: '1.2rem', color: '#1a1a1a' }}>
                  Resumen de cuenta
                </h2>
                <span style={{
                  background: pagoExistente.estado_nombre === 'completado'
                    ? '#e8f8f0' : '#fef6e4',
                  color: pagoExistente.estado_nombre === 'completado'
                    ? '#27ae60' : '#f39c12',
                  fontSize: '0.75rem', fontWeight: 700,
                  borderRadius: '99px', padding: '4px 12px',
                }}>
                  {pagoExistente.estado_nombre === 'completado' ? '✓ Pagado' : '⏳ Pendiente'}
                </span>
              </div>

              {/* Mi parte */}
              <div style={{
                background: '#ffe8df', borderRadius: '14px',
                padding: '16px', marginBottom: '16px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.78rem', color: '#cc3e18',
                  fontWeight: 600, marginBottom: '6px' }}>
                  MI PARTE A PAGAR
                </p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                  fontSize: '2rem', color: '#ff4f1f' }}>
                  ${Number(pagoExistente.mi_monto).toLocaleString()}
                </p>
                {pagoExistente.yo_pague && (
                  <p style={{ fontSize: '0.78rem', color: '#27ae60',
                    fontWeight: 700, marginTop: '6px' }}>
                    ✓ Ya pagaste
                  </p>
                )}
              </div>

              {/* Desglose general */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  fontSize: '0.83rem' }}>
                  <span style={{ color: '#888' }}>Subtotal</span>
                  <span style={{ fontWeight: 600 }}>
                    ${Number(pagoExistente.total).toLocaleString()}
                  </span>
                </div>
                {Number(pagoExistente.deposito_descontado) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.83rem' }}>
                    <span style={{ color: '#27ae60' }}>Descuento depósito reserva</span>
                    <span style={{ color: '#27ae60', fontWeight: 600 }}>
                      -${Number(pagoExistente.deposito_descontado).toLocaleString()}
                    </span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '0.95rem', fontWeight: 700,
                  paddingTop: '10px', borderTop: '1.5px solid #f5f2ed',
                }}>
                  <span>Total final</span>
                  <span style={{ fontFamily: 'Syne, sans-serif',
                    fontWeight: 800, color: '#ff4f1f' }}>
                    ${Number(pagoExistente.total_final).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Desglose por persona */}
              {pagoExistente.detalles?.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '16px',
                  borderTop: '1px solid #f5f2ed' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700,
                    color: '#888', marginBottom: '10px' }}>
                    DESGLOSE POR PERSONA
                  </p>
                  {pagoExistente.detalles.map((d, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', fontSize: '0.83rem',
                      padding: '6px 0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px',
                          borderRadius: '50%', background: '#f5f2ed',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.75rem',
                          fontWeight: 700, color: '#888' }}>
                          {d.usuario_nombre?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {d.usuario_nombre}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'Syne, sans-serif',
                          fontWeight: 700, color: '#1a1a1a' }}>
                          ${Number(d.monto).toLocaleString()}
                        </span>
                        {d.pagado && (
                          <span style={{ color: '#27ae60', fontSize: '0.75rem',
                            fontWeight: 700 }}>✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              background: '#f5f2ed', borderRadius: '14px',
              padding: '14px 16px', textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.5 }}>
                Muestra esta pantalla al mesero para confirmar tu pago.
                La mesa se liberará automáticamente cuando el mesero confirme.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}