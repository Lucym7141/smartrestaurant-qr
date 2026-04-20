from django.urls import path
from .views import (
    InicioView,
    MenuCompletoView,
    PlatoDetalleView,
    PlatosPorCategoriaView,
    PlatoAlergiaView,
    CrearPlatoView,
    EditarPlatoView,
    ToggleDisponibilidadPlatoView,
    CrearDestacadoView,
    ListaIngredientesView,
    ListaAdicionesView,
)

urlpatterns = [
    # Pantalla de inicio
    path('inicio/',                          InicioView.as_view(),                    name='inicio'),

    # Menú público
    path('menu/',                            MenuCompletoView.as_view(),              name='menu'),
    path('menu/categoria/<int:categoria_id>/', PlatosPorCategoriaView.as_view(),      name='platos-categoria'),
    path('menu/plato/<int:pk>/',             PlatoDetalleView.as_view(),              name='plato-detalle'),
    path('menu/plato/<int:plato_id>/alergia/', PlatoAlergiaView.as_view(),            name='plato-alergia'),

    # Administración (solo admin)
    path('menu/plato/crear/',                CrearPlatoView.as_view(),                name='crear-plato'),
    path('menu/plato/<int:pk>/editar/',      EditarPlatoView.as_view(),               name='editar-plato'),
    path('menu/plato/<int:pk>/toggle/',      ToggleDisponibilidadPlatoView.as_view(), name='toggle-plato'),
    path('menu/destacado/crear/',            CrearDestacadoView.as_view(),            name='crear-destacado'),
    path('menu/ingredientes/',               ListaIngredientesView.as_view(),         name='ingredientes'),
    path('menu/adiciones/',                  ListaAdicionesView.as_view(),            name='adiciones'),
]