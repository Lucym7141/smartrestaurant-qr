from django.urls import path
from .views import (
    GenerarPagoView,
    MiPagoView,
    MarcarPagadoView,
    ConfirmarPagoMeseroView,
    ResumenCuentaMesaView,
)

urlpatterns = [
    # Cliente
    path('pagos/generar/',
         GenerarPagoView.as_view(),           name='generar-pago'),
    path('pagos/sesion/<int:sesion_id>/mi-pago/',
         MiPagoView.as_view(),                name='mi-pago'),

    # Mesero / Cajero
    path('pagos/detalle/<int:detalle_pago_id>/marcar-pagado/',
         MarcarPagadoView.as_view(),          name='marcar-pagado'),
    path('pagos/<int:pago_id>/confirmar/',
         ConfirmarPagoMeseroView.as_view(),   name='confirmar-pago-mesero'),
    path('pagos/mesa/<int:sesion_id>/resumen/',
         ResumenCuentaMesaView.as_view(),     name='resumen-cuenta-mesa'),
]
