import api from './axios';

export const getMapaMesas    = ()      => api.get('/mesas/mapa/');
export const escanearQR      = (token) => api.post('/mesas/qr/escanear/', { token });
export const getMiSesion     = ()      => api.get('/mesas/sesion/mi-sesion/');
export const solicitarTarea  = (data)  => api.post('/mesas/tareas/solicitar/', data);
export const liberarMesa     = (id)    => api.post(`/mesas/sesion/${id}/liberar/`);