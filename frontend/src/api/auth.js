import api from './axios';

export const login       = (data) => api.post('/auth/login/', data);
export const registro    = (data) => api.post('/auth/registro/', data);
export const getPerfil   = ()     => api.get('/auth/perfil/');
export const getAlergias = ()     => api.get('/auth/alergias/');
export const addAlergia  = (data) => api.post('/auth/alergias/', data);
export const delAlergia  = (id)   => api.delete(`/auth/alergias/${id}/`);