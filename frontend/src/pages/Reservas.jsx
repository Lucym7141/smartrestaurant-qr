import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMesasDisponibles, crearReserva,
  getMisReservas, cancelarReserva
} from '../api/reservas';
import toast from 'react-hot-toast';
import {
  CalendarDays, Users, MapPin, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';

const ESTADO_RESERVA = {
  pendiente:     { color: '#f39c12', bg: '#fef6e4', label: 'Pendiente'   },
  confirmada:    { color: '#27ae60', bg: '#e8f8f0', label: 'Confirmada'  },
  cancelada:     { color: '#e74c3c', bg: '#fdeaea', label: 'Cancelada'   },
  completada:    { color: '#888',    bg: '#f5f5f5', label: 'Completada'  },
  no_presentado: { color: '#e74c3c', bg: '#fdeaea', label: 'No asistió'  },
};

const COLOR_MESA = {
  disponible: '#27ae60',
  ocupada:    '#e74c3c',
  reservada:  '#f39c12',
};

const inputStyle = {
  width: '100%', padding: '13px 14px',
  border: '1.5px solid #e5e0d8', borderRadius: '12px',
  fontSize: '0.9rem', fontFamily: 'Plus Jakarta Sans, sans-serif',
  background: '#fff', outline: 'none', color: '#1a1a1a',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  letterSpacing: '1.2px', color: '#888', marginBottom: '8px',
};

function PasoFecha({ onNext }) {
  const [fecha,    setFecha]    = useState('');
  const [hora,     setHora]     = useState('');
  const [personas, setPersonas] = useState(2);

  const handleContinuar = () => {
    if (!fecha || !hora) { toast.error('Selecciona fecha y hora'); return; }
    const fechaHora = `${fecha}T${hora}:00`;
    if (new Date(fechaHora) <= new Date()) {
      toast.error('La fecha debe ser en el futuro'); return;
    }
    onNext({ fechaHora, personas });
  };

  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div style={{ background: '#fff', borderRadius: '20px', padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
        fontSize: '1.1rem', color: '#1a1a1a', marginBottom: '6px' }}>
        ¿Cuándo quieres venir?
      </h2>
      <p style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '20px' }}>
        Selecciona fecha, hora y número de personas
      </p>

      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>FECHA</label>
        <input type="date" min={hoy} value={fecha}
          onChange={(e) => setFecha(e.target.value)} style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#ff4f1f'}
          onBlur={e => e.target.style.borderColor = '#e5e0d8'} />
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>HORA</label>
        <input type="time" value={hora}
          onChange={(e) => setHora(e.target.value)} style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#ff4f1f'}
          onBlur={e => e.target.style.borderColor = '#e5e0d8'} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>NÚMERO DE PERSONAS</label>
        <div style={{ display: 'flex', alignItems: 'center',
          gap: '16px', background: '#fafaf9', borderRadius: '12px',
          border: '1.5px solid #e5e0d8', padding: '10px 16px' }}>
          <button onClick={() => setPersonas((p) => Math.max(1, p - 1))}
            style={{ background: '#f0ede8', border: 'none', borderRadius: '8px',
              width: '36px', height: '36px', fontSize: '1.2rem',
              cursor: 'pointer', fontWeight: 700, color: '#1a1a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            −
          </button>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '1.4rem', flex: 1, textAlign: 'center', color: '#1a1a1a' }}>
            {personas}
          </span>
          <button onClick={() => setPersonas((p) => p + 1)}
            style={{ background: '#ff4f1f', border: 'none', borderRadius: '8px',
              width: '36px', height: '36px', fontSize: '1.2rem',
              cursor: 'pointer', fontWeight: 700, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            +
          </button>
        </div>
      </div>

      <button onClick={handleContinuar} style={{
        width: '100%', padding: '15px',
        background: '#ff4f1f', color: '#fff', border: 'none',
        borderRadius: '13px', fontSize: '0.88rem', fontWeight: 700,
        cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
        boxShadow: '0 4px 14px rgba(255,79,31,0.35)', transition: 'opacity 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        Ver mesas disponibles →
      </button>
    </div>
  );
}

function PasoMesa({ params, onNext, onBack }) {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  const { data: mesas = [], isLoading } = useQuery({
    queryKey: ['mesas-disponibles', params],
    queryFn:  () => getMesasDisponibles({
      fecha:        params.fechaHora,
      num_personas: params.personas,
    }).then((r) => r.data),
  });

  return (
    <div style={{ background: '#fff', borderRadius: '20px', padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
        fontSize: '1.1rem', color: '#1a1a1a', marginBottom: '4px' }}>
        Elige tu mesa
      </h2>
      <p style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '16px' }}>
        {new Date(params.fechaHora).toLocaleDateString('es-CO', {
          weekday: 'long', day: 'numeric', month: 'long',
        })} · {params.personas} personas
      </p>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {[
          { color: '#27ae60', label: 'Disponible' },
          { color: '#e74c3c', label: 'Ocupada'    },
          { color: '#f39c12', label: 'Reservada'  },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '11px', color: '#888', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Mapa */}
      <div style={{
        position: 'relative', background: '#fafaf9',
        borderRadius: '16px', height: '260px', marginBottom: '14px',
        border: '1.5px solid #e5e0d8',
        backgroundImage: `
          linear-gradient(rgba(229,224,216,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(229,224,216,0.5) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px',
      }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'center', height: '100%', color: '#aaa', fontSize: '0.85rem' }}>
            Buscando mesas...
          </div>
        ) : mesas.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
            <span style={{ fontSize: '2rem' }}>😔</span>
            <p style={{ color: '#888', fontSize: '0.82rem' }}>No hay mesas disponibles</p>
          </div>
        ) : (
          mesas.map((mesa) => {
            const color        = COLOR_MESA[mesa.estado_nombre] || '#27ae60';
            const activa       = mesaSeleccionada?.id === mesa.id;
            const sillasArriba = Math.ceil((mesa.capacidad || 4) / 2);
            const sillaAbajo   = Math.floor((mesa.capacidad || 4) / 2);
            return (
              <div key={mesa.id}
                onClick={() => setMesaSeleccionada(activa ? null : mesa)}
                style={{
                  position: 'absolute',
                  left: `${mesa.coord_x}%`, top: `${mesa.coord_y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer', zIndex: activa ? 10 : 1,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '3px',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
              >
                {/* Sillas arriba */}
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: sillasArriba }).map((_, i) => (
                    <div key={i} style={{
                      width: '11px', height: '9px', borderRadius: '3px 3px 0 0',
                      background: color, opacity: activa ? 1 : 0.5, transition: 'all 0.25s',
                    }} />
                  ))}
                </div>
                {/* Mesa */}
                <div style={{
                  width: `${Math.max(46, sillasArriba * 15)}px`,
                  height: '32px', borderRadius: '10px',
                  background: activa ? color : '#fff',
                  border: `2px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: activa ? `0 6px 18px ${color}44` : '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.25s',
                }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: '0.8rem', color: activa ? '#fff' : color }}>
                    {mesa.numero}
                  </span>
                </div>
                {/* Sillas abajo */}
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: sillaAbajo }).map((_, i) => (
                    <div key={i} style={{
                      width: '11px', height: '9px', borderRadius: '0 0 3px 3px',
                      background: color, opacity: activa ? 1 : 0.5, transition: 'all 0.25s',
                    }} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {mesaSeleccionada && (
        <div style={{
          background: '#e8f8f0', borderRadius: '12px',
          padding: '12px 16px', marginBottom: '14px',
          border: '1px solid #27ae60', display: 'flex',
          alignItems: 'center', gap: '10px',
        }}>
          <CheckCircle size={18} color="#27ae60" />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a5c2e' }}>
              Mesa {mesaSeleccionada.numero} seleccionada
            </p>
            <p style={{ fontSize: '0.73rem', color: '#27ae60' }}>
              Capacidad: {mesaSeleccionada.capacidad} personas
              {mesaSeleccionada.ubicacion && ` · ${mesaSeleccionada.ubicacion}`}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={{
          padding: '13px 20px', background: '#f5f2ed',
          border: 'none', borderRadius: '12px', fontSize: '0.85rem',
          fontWeight: 600, cursor: 'pointer', color: '#888',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>
          ← Atrás
        </button>
        <button
          onClick={() => mesaSeleccionada && onNext(mesaSeleccionada)}
          disabled={!mesaSeleccionada}
          style={{
            flex: 1, padding: '13px',
            background: mesaSeleccionada ? '#ff4f1f' : '#e5e0d8',
            color: mesaSeleccionada ? '#fff' : '#aaa',
            border: 'none', borderRadius: '12px',
            fontSize: '0.85rem', fontWeight: 700,
            cursor: mesaSeleccionada ? 'pointer' : 'not-allowed',
            fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.2s',
          }}>
          Continuar →
        </button>
      </div>
    </div>
  );
}

function PasoConfirmar({ params, mesa, onBack, onSuccess }) {
  const [deposito, setDeposito] = useState(0);
  const [notas,    setNotas]    = useState('');

  const { mutate: reservar, isPending } = useMutation({
    mutationFn: crearReserva,
    onSuccess: () => {
      toast.success('¡Reserva creada correctamente! 🎉');
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Error al crear la reserva');
    },
  });

  const totalDeposito = Number(deposito) * params.personas;

  const handleReservar = () => {
    reservar({
      mesa_id:              mesa.id,
      fecha_reserva:        params.fechaHora,
      num_personas:         params.personas,
      notas,
      deposito_por_persona: Number(deposito),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: '1.1rem', color: '#1a1a1a', marginBottom: '16px' }}>
          Resumen de tu reserva
        </h2>
        {[
          { icon: <CalendarDays size={16} color="#ff4f1f" />, label: 'Fecha y hora',
            value: new Date(params.fechaHora).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' }) },
          { icon: <MapPin size={16} color="#ff4f1f" />, label: 'Mesa', value: `Mesa ${mesa.numero}` },
          { icon: <Users size={16} color="#ff4f1f" />, label: 'Personas', value: `${params.personas} personas` },
          { icon: <MapPin size={16} color="#ff4f1f" />, label: 'Ubicación', value: mesa.ubicacion || 'Sala principal' },
        ].map(({ icon, label, value }, i, arr) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center',
            gap: '12px', padding: '10px 0',
            borderBottom: i < arr.length - 1 ? '1px solid #f5f2ed' : 'none' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px',
              background: '#fff5f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 600, marginBottom: '1px' }}>
                {label.toUpperCase()}
              </p>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a1a1a' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', padding: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>DEPÓSITO POR PERSONA (opcional)</label>
          <input type="number" min="0" step="0.01"
            value={deposito} onChange={(e) => setDeposito(e.target.value)}
            placeholder="0.00" style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#ff4f1f'}
            onBlur={e => e.target.style.borderColor = '#e5e0d8'} />
          {Number(deposito) > 0 && (
            <div style={{ marginTop: '8px', padding: '10px 14px',
              background: '#fff5f2', borderRadius: '10px',
              display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#cc3e18' }}>Total ({params.personas} personas)</span>
              <span style={{ fontWeight: 700, color: '#ff4f1f' }}>${totalDeposito.toLocaleString()}</span>
            </div>
          )}
          {Number(deposito) > 0 && (
            <div style={{ marginTop: '8px', padding: '10px 14px',
              background: '#fff9e6', borderRadius: '10px',
              display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertTriangle size={13} color="#f39c12" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '0.73rem', color: '#856404', lineHeight: 1.5 }}>
                Puedes cancelar con devolución completa si lo haces con
                <strong> 40 minutos o más</strong> de anticipación.
              </p>
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>NOTAS ESPECIALES (opcional)</label>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)}
            rows={2} placeholder="Ej: mesa cerca de la ventana, ocasión especial..."
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={e => e.target.style.borderColor = '#ff4f1f'}
            onBlur={e => e.target.style.borderColor = '#e5e0d8'} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onBack} style={{
          padding: '13px 20px', background: '#f5f2ed',
          border: 'none', borderRadius: '12px', fontSize: '0.85rem',
          fontWeight: 600, cursor: 'pointer', color: '#888',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>← Atrás</button>
        <button onClick={handleReservar} disabled={isPending} style={{
          flex: 1, padding: '13px',
          background: isPending ? '#ccc' : '#ff4f1f',
          color: '#fff', border: 'none', borderRadius: '12px',
          fontSize: '0.88rem', fontWeight: 700,
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          boxShadow: isPending ? 'none' : '0 4px 14px rgba(255,79,31,0.35)',
        }}>
          {isPending ? 'Reservando...' : 'Confirmar reserva'}
        </button>
      </div>
    </div>
  );
}

function MisReservas() {
  const queryClient = useQueryClient();

  const { data: reservas = [], isLoading } = useQuery({
    queryKey: ['mis-reservas'],
    queryFn:  () => getMisReservas().then((r) => r.data),
  });

  const { mutate: cancelar } = useMutation({
    mutationFn: (id) => cancelarReserva(id, {}),
    onSuccess: (res) => {
      const msg = res.data.devolucion
        ? '✅ Reserva cancelada. Se devolverá tu depósito.'
        : '❌ Reserva cancelada. Sin devolución por cancelación tardía.';
      toast.success(msg, { duration: 5000 });
      queryClient.invalidateQueries(['mis-reservas']);
    },
    onError: () => toast.error('No se puede cancelar esta reserva'),
  });

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '0.85rem' }}>
      Cargando reservas...
    </div>
  );

  if (reservas.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '20px',
        background: '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 14px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)', fontSize: '1.8rem' }}>📅</div>
      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700,
        color: '#1a1a1a', marginBottom: '4px' }}>Sin reservas aún</p>
      <p style={{ color: '#aaa', fontSize: '0.8rem' }}>
        Haz tu primera reserva en la pestaña "Nueva reserva"
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {reservas.map((r) => {
        const estado = ESTADO_RESERVA[r.estado_nombre] || ESTADO_RESERVA.pendiente;
        const puedeCancel = r.puede_cancelar_con_devolucion &&
          ['pendiente', 'confirmada'].includes(r.estado_nombre);
        return (
          <div key={r.id} style={{ background: '#fff', borderRadius: '20px',
            overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ background: estado.bg, padding: '10px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: estado.color,
                display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%',
                  background: estado.color, display: 'inline-block' }} />
                {estado.label}
              </span>
              <span style={{ fontSize: '0.72rem', color: estado.color, fontWeight: 600 }}>#{r.id}</span>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '12px', marginBottom: '12px' }}>
                {[
                  { label: 'Mesa',     value: `Mesa ${r.mesa_numero}` },
                  { label: 'Personas', value: `${r.num_personas} personas` },
                  { label: 'Fecha',    value: new Date(r.fecha_reserva)
                    .toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) },
                  { label: 'Hora',     value: new Date(r.fecha_reserva)
                    .toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#fafaf9', borderRadius: '10px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '0.68rem', color: '#aaa', fontWeight: 600, marginBottom: '3px' }}>
                      {label.toUpperCase()}
                    </p>
                    <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1a1a' }}>{value}</p>
                  </div>
                ))}
              </div>
              {Number(r.deposito_total) > 0 && (
                <div style={{ background: '#fff5f2', borderRadius: '10px',
                  padding: '10px 12px', marginBottom: '12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>Depósito</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: '#ff4f1f', fontSize: '0.9rem' }}>
                      ${Number(r.deposito_total).toLocaleString()}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#aaa' }}>
                      {r.estado_deposito_nombre}
                    </span>
                  </div>
                </div>
              )}
              {['pendiente', 'confirmada'].includes(r.estado_nombre) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px',
                  marginBottom: puedeCancel ? '12px' : '0' }}>
                  {r.puede_cancelar_con_devolucion ? (
                    <>
                      <CheckCircle size={13} color="#27ae60" />
                      <span style={{ fontSize: '0.72rem', color: '#27ae60', fontWeight: 600 }}>
                        Cancela con devolución (más de 40 min restantes)
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} color="#f39c12" />
                      <span style={{ fontSize: '0.72rem', color: '#f39c12', fontWeight: 600 }}>
                        Sin devolución si cancelas ahora
                      </span>
                    </>
                  )}
                </div>
              )}
              {puedeCancel && (
                <button onClick={() => {
                  if (window.confirm('¿Cancelar esta reserva?')) cancelar(r.id);
                }} style={{
                  width: '100%', padding: '11px',
                  background: '#fdeaea', color: '#e74c3c',
                  border: 'none', borderRadius: '10px', fontSize: '0.82rem',
                  fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <XCircle size={14} /> Cancelar reserva
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Reservas() {
  const [tab,    setTab]    = useState('nueva');
  const [paso,   setPaso]   = useState(1);
  const [params, setParams] = useState(null);
  const [mesa,   setMesa]   = useState(null);
  const queryClient = useQueryClient();

  const resetFlujo = () => { setPaso(1); setParams(null); setMesa(null); };

  return (
    <div style={{ background: '#f5f2ed', minHeight: '100dvh',
      paddingBottom: '100px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      <div style={{
        background: '#1a1a1a', padding: '52px 20px 24px',
        borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px',
      }}>
        <p style={{ color: '#555', fontSize: '0.78rem', marginBottom: '4px' }}>Gestiona tu visita</p>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: '2rem', color: '#fff', marginBottom: '20px', letterSpacing: '-0.5px' }}>
          Reservas<span style={{ color: '#ff4f1f' }}>.</span>
        </h1>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.07)',
          borderRadius: '14px', padding: '4px', gap: '4px' }}>
          {[
            { key: 'nueva', label: '+ Nueva reserva' },
            { key: 'mis',   label: 'Mis reservas'    },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { setTab(key); resetFlujo(); }}
              style={{
                flex: 1, padding: '11px',
                background: tab === key ? '#ff4f1f' : 'transparent',
                color: tab === key ? '#fff' : '#666',
                border: 'none', borderRadius: '10px',
                fontSize: '0.82rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                boxShadow: tab === key ? '0 2px 10px rgba(255,79,31,0.3)' : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {tab === 'nueva' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
              {['Fecha', 'Mesa', 'Confirmar'].map((label, i) => {
                const num    = i + 1;
                const activo = paso === num;
                const listo  = paso > num;
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center',
                    gap: '6px', flex: i < 2 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: listo ? '#27ae60' : activo ? '#ff4f1f' : '#e5e0d8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.3s',
                      }}>
                        {listo
                          ? <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>
                          : <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800,
                              fontSize: '0.75rem', color: activo ? '#fff' : '#aaa' }}>{num}</span>
                        }
                      </div>
                      <span style={{ fontSize: '0.73rem', fontWeight: 600,
                        color: activo ? '#1a1a1a' : '#bbb' }}>{label}</span>
                    </div>
                    {i < 2 && (
                      <div style={{ flex: 1, height: '2px',
                        background: listo ? '#27ae60' : '#e5e0d8',
                        borderRadius: '99px', transition: 'background 0.3s' }} />
                    )}
                  </div>
                );
              })}
            </div>

            {paso === 1 && <PasoFecha onNext={(data) => { setParams(data); setPaso(2); }} />}
            {paso === 2 && params && (
              <PasoMesa params={params} onNext={(m) => { setMesa(m); setPaso(3); }} onBack={() => setPaso(1)} />
            )}
            {paso === 3 && params && mesa && (
              <PasoConfirmar params={params} mesa={mesa} onBack={() => setPaso(2)}
                onSuccess={() => { resetFlujo(); setTab('mis'); queryClient.invalidateQueries(['mis-reservas']); }} />
            )}
          </>
        ) : (
          <MisReservas />
        )}
      </div>
    </div>
  );
}