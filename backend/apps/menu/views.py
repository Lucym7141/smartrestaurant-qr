from django.shortcuts import render
from django.db import models
# Create your views here.
from rest_framework import generics, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone

from .models import Categoria, Plato, Destacado, Ingrediente, Adicion
from .serializers import (
    CategoriaSerializer,
    PlatoDetalleSerializer,
    PlatoListSerializer,
    DestacadoSerializer,
    IngredienteSerializer,
    AdicionSerializer,
)
from utils.permisos import EsAdmin


# ─── PANTALLA DE INICIO ───────────────────────────────────────────────────────

class InicioView(views.APIView):
    """
    Lo primero que ve el cliente al escanear el QR:
    destacados activos (plato del día, promos, recomendaciones, descuentos).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        hoy = timezone.now().date()
        destacados = Destacado.objects.filter(
            activo=True,
            fecha_inicio__lte=hoy
        ).filter(
            models.Q(fecha_fin__isnull=True) | models.Q(fecha_fin__gte=hoy)
        )
        return Response(DestacadoSerializer(destacados, many=True).data)


# ─── MENÚ ─────────────────────────────────────────────────────────────────────

class MenuCompletoView(views.APIView):
    """
    Devuelve todas las categorías con sus platos disponibles.
    Es la vista principal del menú que ve el cliente.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        categorias = Categoria.objects.prefetch_related(
            'platos__ingredientes__ingrediente',
            'platos__variantes',
            'platos__adiciones',
        ).all()
        return Response(CategoriaSerializer(categorias, many=True).data)


class PlatoDetalleView(generics.RetrieveAPIView):
    """
    Detalle completo de un plato individual:
    ingredientes, adiciones compatibles, variantes y modelo AR.
    """
    permission_classes = [AllowAny]
    serializer_class   = PlatoDetalleSerializer
    queryset           = Plato.objects.filter(disponible=True)


class PlatosPorCategoriaView(generics.ListAPIView):
    """Filtra platos por categoría."""
    permission_classes = [AllowAny]
    serializer_class   = PlatoListSerializer

    def get_queryset(self):
        return Plato.objects.filter(
            categoria_id=self.kwargs['categoria_id'],
            disponible=True
        )


# ─── ALERGIA — ADVERTENCIA EN PLATO ──────────────────────────────────────────

class PlatoAlergiaView(views.APIView):
    """
    El cliente consulta si un plato tiene ingredientes
    a los que él es alérgico antes de pedirlo.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, plato_id):
        try:
            plato = Plato.objects.get(id=plato_id)
        except Plato.DoesNotExist:
            return Response({'error': 'Plato no encontrado'}, status=404)

        # Ingredientes del plato que son alérgenos para este usuario
        alergias_usuario = request.user.alergias.values_list(
            'ingrediente_id', flat=True)

        ingredientes_peligrosos = plato.ingredientes.filter(
            ingrediente_id__in=alergias_usuario
        ).values_list('ingrediente__nombre', flat=True)

        if ingredientes_peligrosos:
            return Response({
                'tiene_alergenos': True,
                'advertencia': f'Este plato contiene ingredientes a los que eres alérgico.',
                'ingredientes_alergenos': list(ingredientes_peligrosos),
                'puede_pedir': True  # solo advertencia, no bloqueo
            })

        return Response({'tiene_alergenos': False})


# ─── ADMINISTRACIÓN DEL MENÚ (solo admin) ────────────────────────────────────

class CrearPlatoView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, EsAdmin]
    serializer_class   = PlatoDetalleSerializer


class EditarPlatoView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, EsAdmin]
    serializer_class   = PlatoDetalleSerializer
    queryset           = Plato.objects.all()


class ToggleDisponibilidadPlatoView(views.APIView):
    """El admin activa o desactiva un plato del menú."""
    permission_classes = [IsAuthenticated, EsAdmin]

    def patch(self, request, pk):
        try:
            plato = Plato.objects.get(pk=pk)
        except Plato.DoesNotExist:
            return Response({'error': 'Plato no encontrado'}, status=404)

        plato.disponible = not plato.disponible
        plato.save()
        return Response({
            'mensaje': f'Plato {"activado" if plato.disponible else "desactivado"}',
            'disponible': plato.disponible
        })


class CrearDestacadoView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, EsAdmin]
    serializer_class   = DestacadoSerializer


class ListaIngredientesView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, EsAdmin]
    serializer_class   = IngredienteSerializer
    queryset           = Ingrediente.objects.all()


class ListaAdicionesView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, EsAdmin]
    serializer_class   = AdicionSerializer
    queryset           = Adicion.objects.filter(disponible=True)