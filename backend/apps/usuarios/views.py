from django.shortcuts import render

# Create your views here.
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    TokenPersonalizadoSerializer,
    RegistroClienteSerializer,
    UsuarioSerializer,
    AlergiaClienteSerializer,
)
from .models import AlergiaCliente
from utils.permisos import EsCliente


class LoginView(TokenObtainPairView):
    """Endpoint de login — devuelve access y refresh token con rol incluido."""
    permission_classes = [AllowAny]
    serializer_class   = TokenPersonalizadoSerializer


class RegistroClienteView(generics.CreateAPIView):
    """Registro público para clientes nuevos."""
    permission_classes = [AllowAny]
    serializer_class   = RegistroClienteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'mensaje': 'Cuenta creada correctamente'},
            status=status.HTTP_201_CREATED
        )


class MiPerfilView(APIView):
    """El usuario autenticado ve y edita su propio perfil."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)


class MisAlergiasView(generics.ListCreateAPIView):
    """El cliente gestiona sus propias alergias declaradas."""
    permission_classes = [IsAuthenticated, EsCliente]
    serializer_class   = AlergiaClienteSerializer

    def get_queryset(self):
        return AlergiaCliente.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class EliminarAlergiaView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, EsCliente]
    serializer_class   = AlergiaClienteSerializer

    def get_queryset(self):
        return AlergiaCliente.objects.filter(usuario=self.request.user)