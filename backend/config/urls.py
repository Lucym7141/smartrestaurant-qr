"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.usuarios.views import (
    LoginView,
    RegistroClienteView,
    MiPerfilView,
    MisAlergiasView,
    EliminarAlergiaView,
)
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/',    admin.site.urls),
    path('api/auth/', include('apps.usuarios.urls')),
    path('api/',      include('apps.menu.urls')), 
    path('api/',      include('apps.mesas.urls')),
    path('api/',      include('apps.pedidos.urls')),
    path('login/',         LoginView.as_view(),          name='login'),
    path('token/refresh/', TokenRefreshView.as_view(),   name='token_refresh'),
    path('registro/',      RegistroClienteView.as_view(), name='registro'),
    path('perfil/',        MiPerfilView.as_view(),        name='perfil'),
    path('alergias/',      MisAlergiasView.as_view(),     name='alergias'),
    path('alergias/<int:pk>/', EliminarAlergiaView.as_view(), name='eliminar_alergia'),
]
