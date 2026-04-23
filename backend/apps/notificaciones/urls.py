from django.urls import path
from .views import (
    MisNotificacionesView,
    MarcarLeidaView,
    MarcarTodasLeidasView,
    ConteoNoLeidasView,
)

urlpatterns = [
    path('notificaciones/',
         MisNotificacionesView.as_view(),      name='mis-notificaciones'),
    path('notificaciones/no-leidas/',
         ConteoNoLeidasView.as_view(),         name='conteo-no-leidas'),
    path('notificaciones/leer-todas/',
         MarcarTodasLeidasView.as_view(),      name='leer-todas'),
    path('notificaciones/<int:pk>/leer/',
         MarcarLeidaView.as_view(),            name='leer-notificacion'),
]