from django.shortcuts import render

# Create your views here.
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Reserva
from .serializers import (
    ReservaSerializer,
    CrearReservaInputSerializer,
    CancelarReservaInputSerializer,
)
from apps.mesas.models import Mesa
from apps.catalogos.models import EstadoReserva, EstadoDeposito, EstadoMesa
from apps.notificaciones.models import Notificacion
from apps.catalogos.models import TipoNotificacion
from apps.usuarios.models import Usuario
from utils.permisos import EsAdmin, EsAdminOMesero


# ─── MESAS DISPONIBLES PARA RESERVAR ─────────────────────────────────────────

class MesasDisponiblesReservaView(views.APIView):
    """
    El cliente consulta qué mesas están disponibles
    para una fecha y número de personas específicos.
    Se usa para mostrar el mapa antes de reservar.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        fecha_str    = request.query_params.get('fecha')
        num_personas = request.query_params.get('num_personas', 1)

        try:
            num_personas = int(num_personas)
        except ValueError:
            return Response({'error': 'num_personas debe ser un número'}, status=400)

        # Mesas con capacidad suficiente
        mesas = Mesa.objects.filter(
            capacidad__gte=num_personas
        ).select_related('estado')

        # Si se envía fecha, excluir mesas ya reservadas en ese horario
        if fecha_str:
            try:
                from django.utils.dateparse import parse_datetime
                fecha = parse_datetime(fecha_str)
                if fecha:
                    # Margen de 2 horas alrededor de la fecha
                    fecha_inicio = fecha - timedelta(hours=2)
                    fecha_fin    = fecha + timedelta(hours=2)

                    mesas_reservadas = Reserva.objects.filter(
                        fecha_reserva__range=(fecha_inicio, fecha_fin),
                        estado__nombre__in=['pendiente', 'confirmada']
                    ).values_list('mesa_id', flat=True)

                    mesas = mesas.exclude(id__in=mesas_reservadas)
            except Exception:
                pass

        from apps.mesas.serializers import MesaMapaSerializer
        return Response(MesaMapaSerializer(mesas, many=True).data)


# ─── CREAR RESERVA ────────────────────────────────────────────────────────────

class CrearReservaView(views.APIView):
    """
    El cliente crea una reserva con depósito opcional.
    El depósito total se calcula automáticamente:
    deposito_por_persona × num_personas.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CrearReservaInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        mesa      = Mesa.objects.get(id=data['mesa_id'])
        pendiente = EstadoReserva.objects.get(nombre='pendiente')

        # Estado del depósito
        if data['deposito_por_persona'] > 0:
            estado_deposito = EstadoDeposito.objects.get(nombre='pendiente')
        else:
            estado_deposito = EstadoDeposito.objects.get(nombre='pagado')

        deposito_total = data['deposito_por_persona'] * data['num_personas']

        reserva = Reserva.objects.create(
            usuario              = request.user,
            mesa                 = mesa,
            estado               = pendiente,
            fecha_reserva        = data['fecha_reserva'],
            num_personas         = data['num_personas'],
            notas                = data.get('notas', ''),
            deposito_por_persona = data['deposito_por_persona'],
            deposito_total       = deposito_total,
            estado_deposito      = estado_deposito,
        )

        # Marcar mesa como reservada
        reservada        = EstadoMesa.objects.get(nombre='reservada')
        mesa.estado      = reservada
        mesa.save()

        # Notificar al admin
        self._notificar_admin(reserva, request.user)

        return Response(
            ReservaSerializer(reserva).data,
            status=status.HTTP_201_CREATED
        )

    def _notificar_admin(self, reserva, emisor):
        tipo   = TipoNotificacion.objects.get(nombre='nueva_reserva') \
                 if TipoNotificacion.objects.filter(nombre='nueva_reserva').exists() \
                 else None
        if not tipo:
            return
        admins = Usuario.objects.filter(rol__nombre='admin', activo=True)
        for admin in admins:
            Notificacion.objects.create(
                tipo     = tipo,
                emisor   = emisor,
                receptor = admin,
                mensaje  = (
                    f'Nueva reserva: Mesa {reserva.mesa.numero} '
                    f'para {reserva.num_personas} personas '
                    f'el {reserva.fecha_reserva.strftime("%d/%m/%Y %H:%M")}'
                ),
            )


# ─── CANCELAR RESERVA ─────────────────────────────────────────────────────────

class CancelarReservaView(views.APIView):
    """
    El cliente cancela su reserva.
    Regla: si cancela con ≥ 40 minutos de anticipación
    se marca devolucion_aplicada = True y se devuelve el depósito.
    Si cancela con menos tiempo, pierde el depósito.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            reserva = Reserva.objects.get(
                pk=pk,
                usuario=request.user,
                estado__nombre__in=['pendiente', 'confirmada']
            )
        except Reserva.DoesNotExist:
            return Response(
                {'error': 'Reserva no encontrada o no se puede cancelar'},
                status=404
            )

        serializer = CancelarReservaInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ahora              = timezone.now()
        cancelada          = EstadoReserva.objects.get(nombre='cancelada')
        reserva.estado     = cancelada
        reserva.fecha_cancelacion = ahora

        # Verificar si aplica devolución (≥ 40 minutos antes)
        diferencia = reserva.fecha_reserva - ahora
        if diferencia >= timedelta(minutes=40) and reserva.deposito_total > 0:
            reserva.devolucion_aplicada = True
            devuelto = EstadoDeposito.objects.get(nombre='devuelto')
            reserva.estado_deposito = devuelto
            mensaje_devolucion = (
                f'Se devolverá tu depósito de '
                f'${reserva.deposito_total} en los próximos días hábiles.'
            )
        else:
            reserva.devolucion_aplicada = False
            mensaje_devolucion = (
                'No aplica devolución del depósito por cancelación '
                'con menos de 40 minutos de anticipación.'
            )

        reserva.save()

        # Liberar la mesa
        disponible       = EstadoMesa.objects.get(nombre='disponible')
        reserva.mesa.estado = disponible
        reserva.mesa.save()

        return Response({
            'mensaje':            'Reserva cancelada correctamente',
            'devolucion':         reserva.devolucion_aplicada,
            'info_devolucion':    mensaje_devolucion,
            'deposito_total':     str(reserva.deposito_total),
        })


# ─── CONFIRMAR LLEGADA (persona en la puerta) ─────────────────────────────────

class ConfirmarLlegadaView(views.APIView):
    """
    La persona en la puerta (mesero/admin) confirma la llegada del cliente.
    - Si tiene reserva: confirma la reserva y guía al cliente a su mesa.
    - Si no tiene reserva: asigna una mesa disponible.
    En ambos casos registra quién recibió al cliente.
    """
    permission_classes = [IsAuthenticated, EsAdminOMesero]

    def post(self, request):
        correo_cliente = request.data.get('correo_cliente')
        reserva_id     = request.data.get('reserva_id')
        mesa_id        = request.data.get('mesa_id')  # solo si no tiene reserva

        # ── Con reserva ──────────────────────────────────────────────────────
        if reserva_id:
            try:
                reserva = Reserva.objects.select_related('mesa').get(
                    id=reserva_id,
                    estado__nombre='pendiente'
                )
            except Reserva.DoesNotExist:
                return Response({'error': 'Reserva no encontrada'}, status=404)

            confirmada               = EstadoReserva.objects.get(nombre='confirmada')
            reserva.estado           = confirmada
            reserva.usuario_recepcion = request.user
            reserva.save()

            # Marcar depósito como pagado si estaba pendiente
            if reserva.estado_deposito.nombre == 'pendiente':
                pagado                   = EstadoDeposito.objects.get(nombre='pagado')
                reserva.estado_deposito  = pagado
                reserva.save()

            return Response({
                'mensaje':      f'Cliente con reserva confirmado.',
                'mesa_numero':  reserva.mesa.numero,
                'mesa_id':      reserva.mesa.id,
                'num_personas': reserva.num_personas,
                'tiene_reserva': True,
            })

        # ── Sin reserva — asignar mesa disponible ────────────────────────────
        elif mesa_id:
            try:
                mesa = Mesa.objects.get(
                    id=mesa_id,
                    estado__nombre='disponible'
                )
            except Mesa.DoesNotExist:
                return Response(
                    {'error': 'Mesa no disponible'},
                    status=400
                )

            ocupada     = EstadoMesa.objects.get(nombre='ocupada')
            mesa.estado = ocupada
            mesa.save()

            return Response({
                'mensaje':       f'Cliente sin reserva asignado a Mesa {mesa.numero}.',
                'mesa_numero':   mesa.numero,
                'mesa_id':       mesa.id,
                'tiene_reserva': False,
            })

        return Response(
            {'error': 'Debes enviar reserva_id o mesa_id'},
            status=400
        )


# ─── MIS RESERVAS (cliente) ───────────────────────────────────────────────────

class MisReservasView(generics.ListAPIView):
    """El cliente ve todas sus reservas activas e historial."""
    permission_classes = [IsAuthenticated]
    serializer_class   = ReservaSerializer

    def get_queryset(self):
        return Reserva.objects.filter(
            usuario=self.request.user
        ).select_related(
            'mesa', 'estado', 'estado_deposito', 'usuario_recepcion'
        ).order_by('-fecha_creacion')


class DetalleReservaView(generics.RetrieveAPIView):
    """El cliente ve el detalle de una reserva específica."""
    permission_classes = [IsAuthenticated]
    serializer_class   = ReservaSerializer

    def get_queryset(self):
        return Reserva.objects.filter(usuario=self.request.user)


# ─── GESTIÓN ADMIN ────────────────────────────────────────────────────────────

class TodasReservasView(generics.ListAPIView):
    """El admin ve todas las reservas del día o rango de fechas."""
    permission_classes = [IsAuthenticated, EsAdminOMesero]
    serializer_class   = ReservaSerializer

    def get_queryset(self):
        fecha = self.request.query_params.get('fecha')
        qs    = Reserva.objects.select_related(
            'usuario', 'mesa', 'estado',
            'estado_deposito', 'usuario_recepcion'
        ).order_by('fecha_reserva')

        if fecha:
            from django.utils.dateparse import parse_date
            fecha_obj = parse_date(fecha)
            if fecha_obj:
                qs = qs.filter(fecha_reserva__date=fecha_obj)

        return qs


class ConfirmarDepositoView(views.APIView):
    """
    El cajero confirma que recibió el depósito en efectivo
    o que el pago online fue procesado.
    """
    permission_classes = [IsAuthenticated, EsAdminOMesero]

    def patch(self, request, pk):
        try:
            reserva = Reserva.objects.get(pk=pk)
        except Reserva.DoesNotExist:
            return Response({'error': 'Reserva no encontrada'}, status=404)

        pagado                  = EstadoDeposito.objects.get(nombre='pagado')
        reserva.estado_deposito = pagado
        reserva.save()

        return Response({
            'mensaje':         'Depósito confirmado',
            'deposito_total':  str(reserva.deposito_total),
        })
