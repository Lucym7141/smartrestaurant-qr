import { create } from 'zustand';

const useCarritoStore = create((set, get) => ({
  items: [],

  agregarItem: (item) => set((state) => ({
    items: [...state.items, { ...item, _id: Date.now() }]
  })),

  eliminarItem: (_id) => set((state) => ({
    items: state.items.filter((i) => i._id !== _id)
  })),

  limpiarCarrito: () => set({ items: [] }),

  get total() {
    return get().items.reduce((acc, item) => {
      const adiciones = (item.adiciones || [])
        .reduce((a, ad) => a + Number(ad.precio) * ad.cantidad, 0);
      return acc + (Number(item.precio_unit) + adiciones) * item.cantidad;
    }, 0);
  },

  get count() {
    return get().items.reduce((acc, item) => acc + item.cantidad, 0);
  },
}));

export default useCarritoStore;