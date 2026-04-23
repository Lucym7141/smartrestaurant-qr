import api from './axios';

export const getMesasDisponibles = (params) => api.get('/reservas/disponibles/', { params });
export const crearReserva        = (data)   => api.post('/reservas/crear/', data);
export const getMisReservas      = ()       => api.get('/reservas/mis-reservas/');
export const cancelarReserva     = (id, data) => api.post(`/reservas/${id}/cancelar/`, data);