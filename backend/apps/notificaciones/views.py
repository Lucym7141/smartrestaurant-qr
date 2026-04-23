from django.shortcuts import render

# Create your views here.
from django.utils import timezone
from rest_framework import generics, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Notificacion
from .serializers import NotificacionSerializer


class MisNotificacionesView(generics.ListAPIView):
    """
    Cada usuario ve sus propias notificaciones.
    El cocinero ve avisos de nuevos pedidos.
    El mesero ve pedidos listos y solicitudes de limpieza.
    El cliente ve confirmación de pago y estado del pedido.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = NotificacionSerializer

    def get_queryset(self):
        solo_no_leidas = self.request.query_params.get('no_leidas')
        qs = Notificacion.objects.filter(
            receptor=self.request.user
        ).select_related(
            'tipo', 'emisor', 'pedido', 'sesion__mesa'
        ).order_by('-fecha')

        if solo_no_leidas == 'true':
            qs = qs.filter(leida=False)

        return qs


class MarcarLeidaView(views.APIView):
    """El usuario marca una notificación como leída."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notificacion = Notificacion.objects.get(
                pk=pk, receptor=request.user)
        except Notificacion.DoesNotExist:
            return Response({'error': 'Notificación no encontrada'}, status=404)

        notificacion.leida = True
        notificacion.save()
        return Response({'mensaje': 'Notificación marcada como leída'})


class MarcarTodasLeidasView(views.APIView):
    """El usuario marca todas sus notificaciones como leídas de una vez."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        Notificacion.objects.filter(
            receptor=request.user,
            leida=False
        ).update(leida=True)
        return Response({'mensaje': 'Todas las notificaciones marcadas como leídas'})


class ConteoNoLeidasView(views.APIView):
    """
    Devuelve cuántas notificaciones no leídas tiene el usuario.
    Útil para mostrar el badge en el ícono de notificaciones.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conteo = Notificacion.objects.filter(
            receptor=request.user,
            leida=False
        ).count()
        return Response({'no_leidas': conteo})
