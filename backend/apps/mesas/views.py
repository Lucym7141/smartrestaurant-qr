from django.shortcuts import render

import uuid
from django.utils import timezone
from rest_framework import generics, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Mesa, CodigoQR, SesionMesa, UsuarioSesion, TareaMesero
from .serializers import (
    MesaSerializer,
    MesaMapaSerializer,
    SesionMesaSerializer,
    TareaMeseroSerializer,
)
from apps.catalogos.models import EstadoMesa, EstadoSesion, EstadoTarea, TipoTarea
from utils.permisos import EsAdmin, EsMesero, EsAdminOMesero


# ─── MAPA DE MESAS ────────────────────────────────────────────────────────────

class MapaMesasView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        mesas = Mesa.objects.select_related('estado').all()
        return Response(MesaMapaSerializer(mesas, many=True).data)


class DetalleMesaView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class   = MesaSerializer
    queryset           = Mesa.objects.all()


# ─── QR Y SESIÓN ─────────────────────────────────────────────────────────────

class EscanearQRView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response(
                {'error': 'Token requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            qr = CodigoQR.objects.select_related('mesa').get(
                token=token, activo=True)
        except CodigoQR.DoesNotExist:
            return Response(
                {'error': 'QR inválido o inactivo'},
                status=status.HTTP_404_NOT_FOUND
            )

        mesa    = qr.mesa
        activa  = EstadoSesion.objects.get(nombre='activa')
        ocupada = EstadoMesa.objects.get(nombre='ocupada')

        sesion, creada = SesionMesa.objects.get_or_create(
            mesa=mesa,
            estado=activa,
            defaults={'estado': activa}
        )

        if creada:
            mesa.estado = ocupada
            mesa.save()

        usuario_sesion, _ = UsuarioSesion.objects.get_or_create(
            sesion=sesion,
            usuario=request.user
        )

        return Response({
            'mensaje':     f'Bienvenido a la Mesa {mesa.numero}',
            'sesion_id':   sesion.id,
            'mesa_numero': mesa.numero,
            'mesa_id':     mesa.id,
        }, status=status.HTTP_200_OK)


class MiSesionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            usuario_sesion = UsuarioSesion.objects.select_related(
                'sesion__mesa', 'sesion__estado'
            ).get(
                usuario=request.user,
                sesion__estado__nombre='activa'
            )
        except UsuarioSesion.DoesNotExist:
            return Response(
                {'error': 'No tienes una sesión de mesa activa'},
                status=status.HTTP_404_NOT_FOUND
            )

        sesion = usuario_sesion.sesion
        return Response(SesionMesaSerializer(sesion).data)


# ─── ADMINISTRACIÓN DE MESAS ─────────────────────────────────────────────────

class CrearMesaView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, EsAdmin]
    serializer_class   = MesaSerializer

    def perform_create(self, serializer):
        libre = EstadoMesa.objects.get(nombre='libre')
        mesa  = serializer.save(estado=libre)
        CodigoQR.objects.create(mesa=mesa, token=str(uuid.uuid4()))


class EditarMesaView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, EsAdmin]
    serializer_class   = MesaSerializer
    queryset           = Mesa.objects.all()


class RegenerarQRView(views.APIView):
    permission_classes = [IsAuthenticated, EsAdmin]

    def post(self, request, mesa_id):
        try:
            qr = CodigoQR.objects.get(mesa_id=mesa_id)
        except CodigoQR.DoesNotExist:
            return Response({'error': 'Mesa sin QR'}, status=404)

        qr.token  = str(uuid.uuid4())
        qr.activo = True
        qr.save()
        return Response({'mensaje': 'QR regenerado correctamente', 'token': qr.token})


# ─── TAREAS DEL MESERO ────────────────────────────────────────────────────────

class SolicitarTareaView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        sesion_id   = request.data.get('sesion_id')
        tipo_nombre = request.data.get('tipo')
        notas       = request.data.get('notas', '')

        try:
            sesion = SesionMesa.objects.get(id=sesion_id, estado__nombre='activa')
            tipo   = TipoTarea.objects.get(nombre=tipo_nombre)
        except SesionMesa.DoesNotExist:
            return Response({'error': 'Sesión no encontrada'}, status=404)
        except TipoTarea.DoesNotExist:
            return Response({'error': f'Tipo de tarea "{tipo_nombre}" no existe'}, status=400)

        pendiente = EstadoTarea.objects.get(nombre='pendiente')

        tarea = TareaMesero.objects.create(
            sesion         = sesion,
            tipo           = tipo,
            estado         = pendiente,
            solicitado_por = request.user,
            notas          = notas,
        )
        return Response(TareaMeseroSerializer(tarea).data, status=status.HTTP_201_CREATED)


class TareasPendientesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, EsAdminOMesero]
    serializer_class   = TareaMeseroSerializer

    def get_queryset(self):
        return TareaMesero.objects.filter(
            estado__nombre='pendiente'
        ).select_related(
            'sesion__mesa', 'tipo', 'estado', 'solicitado_por'
        ).order_by('fecha_creacion')


class CompletarTareaView(views.APIView):
    permission_classes = [IsAuthenticated, EsAdminOMesero]

    def patch(self, request, pk):
        try:
            tarea = TareaMesero.objects.get(pk=pk)
        except TareaMesero.DoesNotExist:
            return Response({'error': 'Tarea no encontrada'}, status=404)

        completada             = EstadoTarea.objects.get(nombre='completada')
        tarea.estado           = completada
        tarea.mesero           = request.user
        tarea.fecha_completada = timezone.now()
        tarea.save()

        return Response({'mensaje': 'Tarea completada'})


# ─── LIBERAR MESA (con sesión activa) ─────────────────────────────────────────

class LiberarMesaView(views.APIView):
    """Cierra la sesión activa y pone la mesa como libre."""
    permission_classes = [IsAuthenticated, EsAdminOMesero]

    def post(self, request, sesion_id):
        try:
            sesion = SesionMesa.objects.select_related('mesa').get(
                id=sesion_id, estado__nombre='activa')
        except SesionMesa.DoesNotExist:
            return Response(
                {'error': 'Sesión no encontrada o ya cerrada'},
                status=404
            )

        cerrada          = EstadoSesion.objects.get(nombre='cerrada')
        sesion.estado    = cerrada
        sesion.fecha_fin = timezone.now()
        sesion.save()

        libre              = EstadoMesa.objects.get(nombre='libre')
        sesion.mesa.estado = libre
        sesion.mesa.save()

        return Response({'mensaje': f'Mesa {sesion.mesa.numero} liberada correctamente'})


# ─── LIBERAR MESA DIRECTO (sin sesión — para mesas reservadas) ────────────────

class LiberarMesaDirectoView(views.APIView):
    """
    Libera una mesa reservada directamente sin necesitar sesión activa.
    Úsalo cuando la mesa está en estado 'reservada' y no tiene sesión.
    """
    permission_classes = [IsAuthenticated, EsAdminOMesero]

    def post(self, request, mesa_id):
        try:
            mesa = Mesa.objects.get(id=mesa_id)
        except Mesa.DoesNotExist:
            return Response({'error': 'Mesa no encontrada'}, status=404)

        libre       = EstadoMesa.objects.get(nombre='libre')
        mesa.estado = libre
        mesa.save()

        return Response({'mensaje': f'Mesa {mesa.numero} liberada correctamente'})