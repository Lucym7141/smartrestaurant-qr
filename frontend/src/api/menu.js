import api from './axios';

export const getInicio          = ()     => api.get('/inicio/');
export const getMenu            = ()     => api.get('/menu/');
export const getPlato           = (id)   => api.get(`/menu/plato/${id}/`);
export const getPlatoAlergia    = (id)   => api.get(`/menu/plato/${id}/alergia/`);
export const getPlatoCategoria  = (id)   => api.get(`/menu/categoria/${id}/`);