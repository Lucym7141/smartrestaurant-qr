import api from './axios';

export const generarPago    = (data) => api.post('/pagos/generar/', data);
export const getMiPago      = (sid)  => api.get(`/pagos/sesion/${sid}/mi-pago/`);
export const confirmarPago  = (id)   => api.patch(`/pagos/${id}/confirmar/`);