import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      usuario:  null,
      token:    null,
      rol:      null,
      sesionId: null,

      setAuth: (usuario, token, rol) => {
        localStorage.setItem('access_token', token);
        set({ usuario, token, rol });
      },

      setSesion: (sesionId) => set({ sesionId }),

      // Cierra la sesión de mesa sin cerrar sesión de usuario
      salirMesa: () => set({ sesionId: null }),

      logout: () => {
        localStorage.clear();
        set({ usuario: null, token: null, rol: null, sesionId: null });
      },
    }),
    { name: 'auth-storage' }
  )
);

export default useAuthStore;