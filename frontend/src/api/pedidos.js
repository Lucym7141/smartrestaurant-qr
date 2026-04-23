import api from './axios';

export const crearPedido         = (data) => api.post('/pedidos/crear/', data);
export const getMisPedidos       = (sid)  => api.get(`/pedidos/sesion/${sid}/mis-pedidos/`);
export const confirmarRecepcion  = (id)   => api.patch(`/pedidos/${id}/confirmar-recepcion/`);
export const cancelarPedido      = (data) => api.post('/pedidos/cancelar/', data);