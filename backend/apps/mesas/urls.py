from django.urls import path
from .views import (
    MapaMesasView,
    DetalleMesaView,
    EscanearQRView,
    MiSesionView,
    CrearMesaView,
    EditarMesaView,
    RegenerarQRView,
    SolicitarTareaView,
    TareasPendientesView,
    CompletarTareaView,
    LiberarMesaView,
    LiberarMesaDirectoView,
)

urlpatterns = [
    # Mapa virtual
    path('mesas/mapa/',                              MapaMesasView.as_view(),           name='mapa-mesas'),

    # QR y sesión — ANTES de mesas/<int:pk>/
    path('mesas/qr/escanear/',                       EscanearQRView.as_view(),          name='escanear-qr'),
    path('mesas/sesion/mi-sesion/',                  MiSesionView.as_view(),            name='mi-sesion'),
    path('mesas/sesion/<int:sesion_id>/liberar/',    LiberarMesaView.as_view(),         name='liberar-mesa'),

    # Liberar mesa directamente (sin sesión activa — para reservadas)
    path('mesas/<int:mesa_id>/liberar-directo/',     LiberarMesaDirectoView.as_view(),  name='liberar-mesa-directo'),

    # Administración
    path('mesas/crear/',                             CrearMesaView.as_view(),           name='crear-mesa'),
    path('mesas/<int:mesa_id>/qr/regenerar/',        RegenerarQRView.as_view(),         name='regenerar-qr'),
    path('mesas/<int:pk>/editar/',                   EditarMesaView.as_view(),          name='editar-mesa'),
    path('mesas/<int:pk>/',                          DetalleMesaView.as_view(),         name='detalle-mesa'),

    # Tareas del mesero
    path('mesas/tareas/solicitar/',                  SolicitarTareaView.as_view(),      name='solicitar-tarea'),
    path('mesas/tareas/pendientes/',                 TareasPendientesView.as_view(),    name='tareas-pendientes'),
    path('mesas/tareas/<int:pk>/completar/',         CompletarTareaView.as_view(),      name='completar-tarea'),
]