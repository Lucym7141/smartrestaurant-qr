from django.urls import path
from .views import (
    CrearComentarioView,
    MisComentariosView,
    ComentariosPublicosView,
    ResumenValoracionesView,
    GestionComentariosAdminView,
    ToggleVisibilidadComentarioView,
)

urlpatterns = [
    # Cliente
    path('comentarios/crear/',
         CrearComentarioView.as_view(),              name='crear-comentario'),
    path('comentarios/mis-comentarios/',
         MisComentariosView.as_view(),               name='mis-comentarios'),

    # Público
    path('comentarios/',
         ComentariosPublicosView.as_view(),          name='comentarios-publicos'),
    path('comentarios/valoraciones/resumen/',
         ResumenValoracionesView.as_view(),          name='resumen-valoraciones'),

    # Admin
    path('comentarios/admin/',
         GestionComentariosAdminView.as_view(),      name='admin-comentarios'),
    path('comentarios/<int:pk>/toggle/',
         ToggleVisibilidadComentarioView.as_view(),  name='toggle-comentario'),
]