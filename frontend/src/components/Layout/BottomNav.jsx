import { NavLink } from 'react-router-dom';
import { Home, UtensilsCrossed, ShoppingBag, CalendarDays, ClipboardList } from 'lucide-react';
import useCarritoStore from '../../store/useCarritoStore';

const tabs = [
  { to: '/',         icon: Home,             label: 'Inicio'   },
  { to: '/menu',     icon: UtensilsCrossed,  label: 'Menú'     },
  { to: '/carrito',  icon: ShoppingBag,      label: 'Pedido',  badge: true },
  { to: '/pedidos',  icon: ClipboardList,    label: 'Mis pedidos' },
  { to: '/reservas', icon: CalendarDays,     label: 'Reservas' },
];

export default function BottomNav() {
  const count = useCarritoStore((s) => s.count);

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#1a1a1a',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '10px 0 calc(10px + env(safe-area-inset-bottom))',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
      zIndex: 100,
    }}>
      {tabs.map(({ to, icon: Icon, label, badge }) => (
        <NavLink key={to} to={to}>
          {({ isActive }) => (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', textDecoration: 'none', position: 'relative',
              color: isActive ? '#ff4f1f' : '#888888',
              transition: 'color 0.2s',
            }}>
              <div style={{ position: 'relative' }}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {badge && count > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-8px',
                    background: '#ff4f1f', color: '#fff',
                    fontSize: '10px', fontWeight: 700,
                    borderRadius: '99px', padding: '1px 5px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>{count}</span>
                )}
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}