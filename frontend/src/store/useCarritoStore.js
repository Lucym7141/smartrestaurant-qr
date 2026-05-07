import { create } from 'zustand';
 
const useCarritoStore = create((set) => ({
  items: [],
 
  agregarItem: (item) => set((state) => ({
    items: [...state.items, { ...item, _id: Date.now() }],
  })),
 
  eliminarItem: (_id) => set((state) => ({
    items: state.items.filter((i) => i._id !== _id),
  })),
 
  limpiarCarrito: () => set({ items: [] }),
}));
 
// ── Selectores derivados (reactivos con Zustand) ───────────────────────────
// Úsalos así:
//   const count = useCarritoStore(selectCount);
//   const total = useCarritoStore(selectTotal);
 
export const selectCount = (s) =>
  s.items.reduce((acc, i) => acc + i.cantidad, 0);
 
export const selectTotal = (s) =>
  s.items.reduce((acc, i) => {
    const adiciones = (i.adiciones || [])
      .reduce((a, ad) => a + Number(ad.precio) * ad.cantidad, 0);
    return acc + (Number(i.precio_unit) + adiciones) * i.cantidad;
  }, 0);
 
export default useCarritoStore;