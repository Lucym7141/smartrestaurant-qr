from django.shortcuts import render

# Create your views here.
from django.utils import timezone
from rest_framework import generics, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    Pedido, DetallePedido, DetalleAdicion,
    DetalleIngredienteRemovido, CancelacionPedido
)
from .serializers import (
    PedidoSerializer,
    CrearPedidoInputSerializer,
    CancelacionPedidoSerializer,
)
from apps.mesas.models import SesionMesa, UsuarioSesion
from apps.menu.models import Plato, VariantePlato, Adicion, Ingrediente
from apps.catalogos.models import (
    EstadoPedido, EstadoCancelacion, EstacionCocina
)
from apps.notificaciones.models import Notificacion
from apps.catalogos.models import TipoNotificacion
from apps.usuarios.models import Usuario
from utils.permisos import EsMesero, EsCocinero, EsAdmin, EsCocineroOMesero, EsAdminOMesero


# ─── CREAR PEDIDO ─────────────────────────────────────────────────────────────

class CrearPedidoView(views.APIView):
    """
    El cliente crea su pedido desde la mesa.
    - Valida que pertenezca a la sesión.
    - Calcula precios al momento del pedido.
    - Asigna la estación de cocina según la categoría del plato.
    - Genera el nombre del pedido con el número de mesa.
    - Notifica al cocinero correspondiente.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CrearPedidoInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Verificar que el usuario pertenece a la sesión
        try:
            sesion = SesionMesa.objects.get(
                id=data['sesion_id'],
                estado__nombre='activa'
            )
            UsuarioSesion.objects.get(sesion=sesion, usuario=request.user)
        except SesionMesa.DoesNotExist:
            return Response({'error': 'Sesión no encontrada'}, status=404)
        except UsuarioSesion.DoesNotExist:
            return Response(
                {'error': 'No perteneces a esta mesa'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Determinar estación según el primer plato del pedido
        primer_plato = Plato.objects.select_related(
            'categoria__estacion'
        ).get(id=data['items'][0]['plato_id'])

        estacion = primer_plato.categoria.estacion

        # Generar nombre del pedido: "Mesa 4 - Pedido #0023"
        total_pedidos = Pedido.objects.filter(sesion=sesion).count() + 1
        nombre_pedido = f'Mesa {sesion.mesa.numero} - Pedido #{str(total_pedidos).zfill(4)}'

        pendiente = EstadoPedido.objects.get(nombre='pendiente')

        pedido = Pedido.objects.create(
            sesion        = sesion,
            estado        = pendiente,
            estacion      = estacion,
            nombre_pedido = nombre_pedido,
        )

        # Crear cada ítem del pedido
        for item in data['items']:
            plato    = Plato.objects.get(id=item['plato_id'])
            variante = None
            precio   = plato.precio_base

            if item.get('variante_id'):
                variante = VariantePlato.objects.get(id=item['variante_id'])
                precio  += variante.precio_extra

            detalle = DetallePedido.objects.create(
                pedido             = pedido,
                usuario            = request.user,
                plato              = plato,
                variante           = variante,
                cantidad           = item['cantidad'],
                precio_unit        = precio,
                notas              = item.get('notas', ''),
                alergia_confirmada = item.get('alergia_confirmada', False),
            )

            # Agregar adiciones con su precio al momento del pedido
            for adicion_input in item.get('adiciones', []):
                adicion = Adicion.objects.get(id=adicion_input['adicion_id'])
                DetalleAdicion.objects.create(
                    detalle_pedido  = detalle,
                    adicion         = adicion,
                    cantidad        = adicion_input['cantidad'],
                    precio_aplicado = adicion.precio,
                )

            # Registrar ingredientes removidos
            for ing_id in item.get('ingredientes_a_remover', []):
                ingrediente = Ingrediente.objects.get(id=ing_id)
                DetalleIngredienteRemovido.objects.create(
                    detalle_pedido = detalle,
                    ingrediente    = ingrediente,
                )

        # Notificar al cocinero de la estación
        self._notificar_cocinero(pedido, estacion, request.user)

        return Response(
            PedidoSerializer(pedido).data,
            status=status.HTTP_201_CREATED
        )

    def _notificar_cocinero(self, pedido, estacion, emisor):
        if not estacion:
            return
        tipo = TipoNotificacion.objects.get(nombre='nuevo_pedido')
        cocineros = Usuario.objects.filter(
            estaciones__estacion=estacion,
            estaciones__activo=True
        )
        for cocinero in cocineros:
            Notificacion.objects.create(
                tipo     = tipo,
                emisor   = emisor,
                receptor = cocinero,
                pedido   = pedido,
                sesion   = pedido.sesion,
                mensaje  = f'Nuevo pedido: {pedido.nombre_pedido}',
            )


# ─── VISTAS DEL COCINERO ──────────────────────────────────────────────────────

class PedidosEstacionView(generics.ListAPIView):
    """
    El cocinero ve los pedidos de su estación:
    ingredientes, adiciones, alergias y notas del cliente.
    """
    permission_classes = [IsAuthenticated, EsAdminOMesero]
    serializer_class   = PedidoSerializer

    def get_queryset(self):
        # Obtener la estación del cocinero autenticado
        estaciones = self.request.user.estaciones.filter(
            activo=True
        ).values_list('estacion_id', flat=True)

        return Pedido.objects.filter(
            estacion_id__in=estaciones,
            estado__nombre__in=['pendiente', 'en_preparacion']
        ).prefetch_related(
            'detalles__adiciones__adicion',
            'detalles__ingredientes_removidos__ingrediente',
            'detalles__plato__ingredientes__ingrediente',
        ).order_by('fecha')


class CambiarEstadoPedidoView(views.APIView):
    """
    El cocinero actualiza el estado del pedido:
    pendiente → en_preparacion → listo
    Cuando está listo notifica al mesero.
    """
    permission_classes = [IsAuthenticated, EsAdminOMesero]
    def patch(self, request, pk):
        try:
            pedido = Pedido.objects.get(pk=pk)
        except Pedido.DoesNotExist:
            return Response({'error': 'Pedido no encontrado'}, status=404)

        nuevo_estado = request.data.get('estado')
        estados_validos = ['en_preparacion', 'listo']

        if nuevo_estado not in estados_validos:
            return Response(
                {'error': f'Estado debe ser uno de: {estados_validos}'},
                status=400
            )

        estado_obj     = EstadoPedido.objects.get(nombre=nuevo_estado)
        pedido.estado  = estado_obj

        # Si el cocinero marca como listo → avisar al mesero
        if nuevo_estado == 'listo':
            pedido.aviso_mesero = True
            self._notificar_mesero(pedido, request.user)

        pedido.save()
        return Response(PedidoSerializer(pedido).data)

    def _notificar_mesero(self, pedido, emisor):
        tipo = TipoNotificacion.objects.get(nombre='pedido_listo')
        # Notificar al mesero asignado o a todos los meseros si no hay asignado
        if pedido.mesero_asignado:
            receptores = [pedido.mesero_asignado]
        else:
            receptores = Usuario.objects.filter(rol__nombre='mesero', activo=True)

        for mesero in receptores:
            Notificacion.objects.create(
                tipo     = tipo,
                emisor   = emisor,
                receptor = mesero,
                pedido   = pedido,
                sesion   = pedido.sesion,
                mensaje  = f'Pedido listo para entregar: {pedido.nombre_pedido}',
            )


# ─── VISTAS DEL CLIENTE ───────────────────────────────────────────────────────

class MisPedidosView(generics.ListAPIView):
    """El cliente ve todos sus pedidos en la sesión activa."""
    permission_classes = [IsAuthenticated]
    serializer_class   = PedidoSerializer

    def get_queryset(self):
        sesion_id = self.kwargs.get('sesion_id')
        return Pedido.objects.filter(
            sesion_id=sesion_id,
            detalles__usuario=self.request.user
        ).distinct().prefetch_related('detalles__adiciones', 'detalles__ingredientes_removidos')


class ConfirmarRecepcionView(views.APIView):
    """
    El cliente toca el botón para confirmar que recibió su pedido.
    Cambia el estado a 'entregado'.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            pedido = Pedido.objects.get(pk=pk, estado__nombre='listo')
            # Verificar que el cliente pertenece a la sesión del pedido
            UsuarioSesion.objects.get(
                sesion=pedido.sesion, usuario=request.user)
        except Pedido.DoesNotExist:
            return Response(
                {'error': 'Pedido no encontrado o no está listo aún'},
                status=404
            )
        except UsuarioSesion.DoesNotExist:
            return Response({'error': 'No autorizado'}, status=403)

        entregado                    = EstadoPedido.objects.get(nombre='entregado')
        pedido.estado                = entregado
        pedido.recibido_por_cliente  = True
        pedido.fecha_entrega         = timezone.now()
        pedido.save()

        return Response({'mensaje': '¡Pedido recibido! Buen provecho 🍽️'})


# ─── CANCELACIONES ────────────────────────────────────────────────────────────

class CancelarPedidoView(views.APIView):
    """
    Cancela un pedido completo (toda la mesa) o un ítem individual.
    - Si se envía pedido_id → cancela todo el pedido.
    - Si se envía detalle_id → cancela solo ese ítem del cliente.
    Solo se puede cancelar si el pedido está en estado 'pendiente'.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pedido_id  = request.data.get('pedido_id')
        detalle_id = request.data.get('detalle_id')
        motivo     = request.data.get('motivo', '')

        if not pedido_id and not detalle_id:
            return Response(
                {'error': 'Debes enviar pedido_id o detalle_id'},
                status=400
            )

        solicitada = EstadoCancelacion.objects.get(nombre='solicitada')

        if pedido_id:
            # Cancelación de pedido completo
            try:
                pedido = Pedido.objects.get(
                    id=pedido_id, estado__nombre='pendiente')
            except Pedido.DoesNotExist:
                return Response(
                    {'error': 'Pedido no encontrado o ya no se puede cancelar'},
                    status=404
                )
            cancelacion = CancelacionPedido.objects.create(
                pedido         = pedido,
                estado         = solicitada,
                motivo         = motivo,
                solicitado_por = request.user,
            )
            # Cambiar estado del pedido
            cancelado      = EstadoPedido.objects.get(nombre='cancelado') \
                             if EstadoPedido.objects.filter(nombre='cancelado').exists() \
                             else EstadoPedido.objects.get(nombre='pendiente')
            pedido.estado  = EstadoPedido.objects.get(nombre='pendiente')
            pedido.save()

        else:
            # Cancelación de ítem individual
            try:
                detalle = DetallePedido.objects.get(
                    id=detalle_id,
                    usuario=request.user,
                    pedido__estado__nombre='pendiente'
                )
            except DetallePedido.DoesNotExist:
                return Response(
                    {'error': 'Ítem no encontrado o ya no se puede cancelar'},
                    status=404
                )
            cancelacion = CancelacionPedido.objects.create(
                detalle_pedido = detalle,
                estado         = solicitada,
                motivo         = motivo,
                solicitado_por = request.user,
            )

        return Response(
            CancelacionPedidoSerializer(cancelacion).data,
            status=status.HTTP_201_CREATED
        )


class AprobarCancelacionView(views.APIView):
    """El mesero o admin aprueba o rechaza una solicitud de cancelación."""
    permission_classes = [IsAuthenticated, EsAdminOMesero]

    def patch(self, request, pk):
        try:
            cancelacion = CancelacionPedido.objects.get(pk=pk)
        except CancelacionPedido.DoesNotExist:
            return Response({'error': 'Cancelación no encontrada'}, status=404)

        decision = request.data.get('decision')  # 'aprobada' o 'rechazada'
        if decision not in ['aprobada', 'rechazada']:
            return Response({'error': 'decision debe ser aprobada o rechazada'}, status=400)

        estado_cancelacion          = EstadoCancelacion.objects.get(nombre=decision)
        cancelacion.estado          = estado_cancelacion
        cancelacion.fecha_resolucion = timezone.now()
        cancelacion.save()

        # Si fue aprobada y es cancelación de pedido completo
        if decision == 'aprobada' and cancelacion.pedido:
            cancelado         = EstadoPedido.objects.get(nombre='pendiente')
            cancelacion.pedido.estado = cancelado
            cancelacion.pedido.save()

        return Response({'mensaje': f'Cancelación {decision}'})


# ─── PEDIDOS DE LA MESA (mesero/admin) ────────────────────────────────────────

class PedidosMesaView(generics.ListAPIView):
    """El mesero ve todos los pedidos de una sesión de mesa."""
    permission_classes = [IsAuthenticated, EsAdminOMesero]
    serializer_class   = PedidoSerializer

    def get_queryset(self):
        return Pedido.objects.filter(
            sesion_id=self.kwargs['sesion_id']
        ).prefetch_related(
            'detalles__adiciones',
            'detalles__ingredientes_removidos'
        ).order_by('fecha')