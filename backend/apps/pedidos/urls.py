from django.urls import path
from .views import (
    CrearPedidoView,
    PedidosEstacionView,
    CambiarEstadoPedidoView,
    MisPedidosView,
    ConfirmarRecepcionView,
    CancelarPedidoView,
    AprobarCancelacionView,
    PedidosMesaView,
)

urlpatterns = [
    # Cliente
    path('pedidos/crear/',
         CrearPedidoView.as_view(),            name='crear-pedido'),
    path('pedidos/sesion/<int:sesion_id>/mis-pedidos/',
         MisPedidosView.as_view(),             name='mis-pedidos'),
    path('pedidos/<int:pk>/confirmar-recepcion/',
         ConfirmarRecepcionView.as_view(),     name='confirmar-recepcion'),

    # Cancelaciones
    path('pedidos/cancelar/',
         CancelarPedidoView.as_view(),         name='cancelar-pedido'),
    path('pedidos/cancelaciones/<int:pk>/aprobar/',
         AprobarCancelacionView.as_view(),     name='aprobar-cancelacion'),

    # Cocinero
    path('pedidos/estacion/',
         PedidosEstacionView.as_view(),        name='pedidos-estacion'),
    path('pedidos/<int:pk>/estado/',
         CambiarEstadoPedidoView.as_view(),    name='cambiar-estado-pedido'),

    # Mesero / Admin
    path('pedidos/mesa/<int:sesion_id>/',
         PedidosMesaView.as_view(),            name='pedidos-mesa'),
]