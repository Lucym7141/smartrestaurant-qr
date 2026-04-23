from django.urls import path
from .views import (
    MesasDisponiblesReservaView,
    CrearReservaView,
    CancelarReservaView,
    ConfirmarLlegadaView,
    MisReservasView,
    DetalleReservaView,
    TodasReservasView,
    ConfirmarDepositoView,
)

urlpatterns = [
    # Cliente
    path('reservas/disponibles/',
         MesasDisponiblesReservaView.as_view(),  name='mesas-disponibles-reserva'),
    path('reservas/crear/',
         CrearReservaView.as_view(),             name='crear-reserva'),
    path('reservas/mis-reservas/',
         MisReservasView.as_view(),              name='mis-reservas'),
    path('reservas/<int:pk>/',
         DetalleReservaView.as_view(),           name='detalle-reserva'),
    path('reservas/<int:pk>/cancelar/',
         CancelarReservaView.as_view(),          name='cancelar-reserva'),

    # Puerta (mesero/admin)
    path('reservas/confirmar-llegada/',
         ConfirmarLlegadaView.as_view(),         name='confirmar-llegada'),

    # Admin / Cajero
    path('reservas/todas/',
         TodasReservasView.as_view(),            name='todas-reservas'),
    path('reservas/<int:pk>/confirmar-deposito/',
         ConfirmarDepositoView.as_view(),        name='confirmar-deposito'),
]