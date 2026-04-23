from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    RegistroClienteView,
    MiPerfilView,
    MisAlergiasView,
    EliminarAlergiaView,
)

urlpatterns = [
    path('login/',         LoginView.as_view(),          name='login'),
    path('token/refresh/', TokenRefreshView.as_view(),   name='token_refresh'),
    path('registro/',      RegistroClienteView.as_view(), name='registro'),
    path('perfil/',        MiPerfilView.as_view(),        name='perfil'),
    path('alergias/',      MisAlergiasView.as_view(),     name='alergias'),
    path('alergias/<int:pk>/', EliminarAlergiaView.as_view(), name='eliminar_alergia'),
]