from django.shortcuts import render

# Create your views here.
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
    """
    Devuelve todas las mesas con su estado actual para
    renderizar el mapa virtual (disponible / ocupada / reservada).
    Accesible sin autenticación para la pantalla de reservas.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        mesas = Mesa.objects.select_related('estado').all()
        return Response(MesaMapaSerializer(mesas, many=True).data)


class DetalleMesaView(generics.RetrieveAPIView):
    """
    Al acercarse a una mesa en el mapa muestra su detalle:
    número, capacidad, ubicación y estado.
    """
    permission_classes = [AllowAny]
    serializer_class   = MesaSerializer
    queryset           = Mesa.objects.all()


# ─── QR Y SESIÓN ─────────────────────────────────────────────────────────────

class EscanearQRView(views.APIView):
    """
    El cliente escanea el QR de su mesa.
    1. Valida el token del QR.
    2. Si la mesa no tiene sesión activa, crea una nueva.
    3. Une al cliente a la sesión de esa mesa.
    4. Devuelve el id de sesión para que el frontend lo use en los pedidos.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response(
                {'error': 'Token requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar QR
        try:
            qr = CodigoQR.objects.select_related('mesa').get(
                token=token, activo=True)
        except CodigoQR.DoesNotExist:
            return Response(
                {'error': 'QR inválido o inactivo'},
                status=status.HTTP_404_NOT_FOUND
            )

        mesa   = qr.mesa
        activa = EstadoSesion.objects.get(nombre='activa')
        ocupada = EstadoMesa.objects.get(nombre='ocupada')

        # Buscar sesión activa existente o crear una nueva
        sesion, creada = SesionMesa.objects.get_or_create(
            mesa=mesa,
            estado=activa,
            defaults={'estado': activa}
        )

        # Si es sesión nueva, marcar mesa como ocupada
        if creada:
            mesa.estado = ocupada
            mesa.save()

        # Unir al usuario a la sesión si no está ya
        usuario_sesion, _ = UsuarioSesion.objects.get_or_create(
            sesion=sesion,
            usuario=request.user
        )

        return Response({
            'mensaje': f'Bienvenido a la Mesa {mesa.numero}',
            'sesion_id':   sesion.id,
            'mesa_numero': mesa.numero,
            'mesa_id':     mesa.id,
        }, status=status.HTTP_200_OK)


class MiSesionView(views.APIView):
    """
    El cliente consulta la sesión activa a la que pertenece:
    quiénes están en su mesa y el estado del pago.
    """
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


# ─── ADMINISTRACIÓN DE MESAS (solo admin) ────────────────────────────────────

class CrearMesaView(generics.CreateAPIView):
    """El admin crea una mesa y su QR se genera automáticamente."""
    permission_classes = [IsAuthenticated, EsAdmin]
    serializer_class   = MesaSerializer

    def perform_create(self, serializer):
        disponible = EstadoMesa.objects.get(nombre='disponible')
        mesa = serializer.save(estado=disponible)

        # Generar QR automáticamente al crear la mesa
        CodigoQR.objects.create(
            mesa=mesa,
            token=str(uuid.uuid4())  # token único y seguro
        )


class EditarMesaView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, EsAdmin]
    serializer_class   = MesaSerializer
    queryset           = Mesa.objects.all()


class RegenerarQRView(views.APIView):
    """El admin regenera el QR de una mesa (si fue comprometido)."""
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
    """
    Cliente o mesero solicitan una tarea:
    limpieza de mesa, atención, etc.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        sesion_id  = request.data.get('sesion_id')
        tipo_nombre = request.data.get('tipo')  # 'limpieza_mesa', 'atencion_solicitud'
        notas      = request.data.get('notas', '')

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
        return Response(
            TareaMeseroSerializer(tarea).data,
            status=status.HTTP_201_CREATED
        )


class TareasPendientesView(generics.ListAPIView):
    """El mesero ve todas las tareas pendientes asignadas o sin asignar."""
    permission_classes = [IsAuthenticated, EsAdminOMesero]
    serializer_class   = TareaMeseroSerializer

    def get_queryset(self):
        return TareaMesero.objects.filter(
            estado__nombre='pendiente'
        ).select_related(
            'sesion__mesa', 'tipo', 'estado', 'solicitado_por'
        ).order_by('fecha_creacion')


class CompletarTareaView(views.APIView):
    """El mesero marca una tarea como completada."""
    permission_classes = [IsAuthenticated, EsAdminOMesero]

    def patch(self, request, pk):
        try:
            tarea = TareaMesero.objects.get(pk=pk)
        except TareaMesero.DoesNotExist:
            return Response({'error': 'Tarea no encontrada'}, status=404)

        completada = EstadoTarea.objects.get(nombre='completada')
        tarea.estado           = completada
        tarea.mesero           = request.user
        tarea.fecha_completada = timezone.now()
        tarea.save()

        return Response({'mensaje': 'Tarea completada'})


# ─── LIBERAR MESA (después de confirmar pago) ─────────────────────────────────

class LiberarMesaView(views.APIView):
    """
    Solo se ejecuta cuando el pago fue confirmado por el mesero.
    Cierra la sesión y pone la mesa como disponible.
    """
    permission_classes = [IsAuthenticated, EsAdminOMesero]

    def post(self, request, sesion_id):
        try:
            sesion = SesionMesa.objects.select_related('mesa').get(
                id=sesion_id, estado__nombre='activa')
        except SesionMesa.DoesNotExist:
            return Response({'error': 'Sesión no encontrada o ya cerrada'}, status=404)

        if not sesion.pago_confirmado:
            return Response(
                {'error': 'No se puede liberar la mesa hasta confirmar el pago'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cerrar sesión
        cerrada    = EstadoSesion.objects.get(nombre='cerrada')
        sesion.estado   = cerrada
        sesion.fecha_fin = timezone.now()
        sesion.save()

        # Liberar mesa
        disponible     = EstadoMesa.objects.get(nombre='disponible')
        sesion.mesa.estado = disponible
        sesion.mesa.save()

        return Response({'mensaje': f'Mesa {sesion.mesa.numero} liberada correctamente'})
