from django.shortcuts import render

# Create your views here.
from decimal import Decimal
from django.utils import timezone
from rest_framework import generics, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Pago, DetallePago
from .serializers import PagoSerializer, GenerarPagoInputSerializer
from apps.mesas.models import SesionMesa, UsuarioSesion
from apps.pedidos.models import Pedido, DetallePedido, DetalleAdicion
from apps.reservas.models import Reserva
from apps.catalogos.models import (
    EstadoPago, MetodoPago, TipoDivision, EstadoDeposito
)
from apps.notificaciones.models import Notificacion
from apps.catalogos.models import TipoNotificacion
from apps.usuarios.models import Usuario
from utils.permisos import EsMesero, EsCajero, EsAdmin, EsAdminOMesero


# ─── CALCULAR TOTALES ─────────────────────────────────────────────────────────

def calcular_total_sesion(sesion):
    """Calcula el total de todos los pedidos entregados en la sesión."""
    total = Decimal('0.00')
    pedidos = Pedido.objects.filter(
        sesion=sesion,
        estado__nombre='entregado'
    )
    for pedido in pedidos:
        for detalle in pedido.detalles.all():
            total += detalle.precio_unit * detalle.cantidad
            for adicion in detalle.adiciones.all():
                total += adicion.precio_aplicado * adicion.cantidad
    return total


def calcular_total_por_usuario(sesion):
    """
    Calcula cuánto debe pagar cada persona según
    lo que consumió individualmente.
    """
    totales = {}
    pedidos = Pedido.objects.filter(
        sesion=sesion,
        estado__nombre='entregado'
    )
    for pedido in pedidos:
        for detalle in pedido.detalles.all():
            uid    = detalle.usuario_id
            nombre = detalle.usuario.nombre
            if uid not in totales:
                totales[uid] = {'nombre': nombre, 'monto': Decimal('0.00')}

            subtotal = detalle.precio_unit * detalle.cantidad
            for adicion in detalle.adiciones.all():
                subtotal += adicion.precio_aplicado * adicion.cantidad

            totales[uid]['monto'] += subtotal
    return totales


# ─── GENERAR PAGO ─────────────────────────────────────────────────────────────

class GenerarPagoView(views.APIView):
    """
    Genera el pago de una sesión de mesa.

    División individual → cada persona paga lo que consumió.
    División igualitaria → el total se divide entre todos los comensales.

    Si hay depósito de reserva, se descuenta del total final.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerarPagoInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Validar sesión
        try:
            sesion = SesionMesa.objects.get(
                id=data['sesion_id'],
                estado__nombre='activa'
            )
        except SesionMesa.DoesNotExist:
            return Response({'error': 'Sesión no encontrada'}, status=404)

        # Evitar doble pago
        if Pago.objects.filter(
            sesion=sesion,
            estado__nombre__in=['pendiente', 'completado']
        ).exists():
            return Response(
                {'error': 'Esta mesa ya tiene un pago generado'},
                status=400
            )

        # Obtener catálogos
        try:
            metodo        = MetodoPago.objects.get(nombre=data['metodo_pago'])
            tipo_division = TipoDivision.objects.get(nombre=data['tipo_division'])
            pendiente     = EstadoPago.objects.get(nombre='pendiente')
        except (MetodoPago.DoesNotExist, TipoDivision.DoesNotExist):
            return Response({'error': 'Método de pago o tipo de división inválido'}, status=400)

        # Calcular total general
        total = calcular_total_sesion(sesion)

        if total == Decimal('0.00'):
            return Response(
                {'error': 'No hay pedidos entregados para cobrar'},
                status=400
            )

        # Calcular descuento de depósito de reserva
        deposito_descontado = Decimal('0.00')

        if data.get('aplicar_deposito') and data.get('reserva_id'):
            try:
                reserva = Reserva.objects.get(
                    id=data['reserva_id'],
                    id_usuario=request.user,
                    estado_deposito__nombre='pagado'
                )
                deposito_descontado          = reserva.deposito_total
                reserva.estado_deposito      = EstadoDeposito.objects.get(
                                                   nombre='aplicado_a_cuenta')
                reserva.save()
            except Reserva.DoesNotExist:
                pass  # Si no hay reserva válida, no se descuenta nada

        total_final = max(total - deposito_descontado, Decimal('0.00'))

        # Crear el pago
        pago = Pago.objects.create(
            sesion              = sesion,
            estado              = pendiente,
            metodo              = metodo,
            tipo_division       = tipo_division,
            total               = total,
            deposito_descontado = deposito_descontado,
            total_final         = total_final,
        )

        # Generar desglose por persona según tipo de división
        participantes = UsuarioSesion.objects.filter(
            sesion=sesion
        ).select_related('usuario')

        num_personas = participantes.count()

        if data['tipo_division'] == 'igualitaria':
            # Dividir total en partes iguales
            monto_por_persona = round(total_final / num_personas, 2)
            # Ajuste de centavos en la última persona
            monto_ajuste = total_final - (monto_por_persona * (num_personas - 1))

            for i, us in enumerate(participantes):
                monto = monto_ajuste if i == num_personas - 1 else monto_por_persona
                DetallePago.objects.create(
                    pago    = pago,
                    usuario = us.usuario,
                    monto   = monto,
                )

        else:
            # División individual — cada quien paga lo que consumió
            totales_individuales = calcular_total_por_usuario(sesion)

            # Si hay descuento por depósito, distribuirlo proporcionalmente
            for uid, info in totales_individuales.items():
                if total > Decimal('0.00') and deposito_descontado > Decimal('0.00'):
                    proporcion = info['monto'] / total
                    descuento  = round(deposito_descontado * proporcion, 2)
                    monto_final = max(info['monto'] - descuento, Decimal('0.00'))
                else:
                    monto_final = info['monto']

                usuario = Usuario.objects.get(id=uid)
                DetallePago.objects.create(
                    pago    = pago,
                    usuario = usuario,
                    monto   = monto_final,
                )

        return Response(
            PagoSerializer(pago).data,
            status=status.HTTP_201_CREATED
        )


# ─── CONSULTAR PAGO DE MI MESA ────────────────────────────────────────────────

class MiPagoView(views.APIView):
    """
    El cliente consulta el desglose de su cuenta:
    lo que debe pagar y el estado del pago.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, sesion_id):
        try:
            pago = Pago.objects.get(sesion_id=sesion_id)
        except Pago.DoesNotExist:
            return Response({'error': 'Pago no generado aún'}, status=404)

        # Mostrar solo su parte del desglose
        mi_detalle = DetallePago.objects.filter(
            pago=pago, usuario=request.user
        ).first()

        data = PagoSerializer(pago).data
        data['mi_monto'] = str(mi_detalle.monto) if mi_detalle else '0.00'
        data['yo_pague'] = mi_detalle.pagado if mi_detalle else False

        return Response(data)


# ─── CONFIRMAR PAGO INDIVIDUAL ────────────────────────────────────────────────

class MarcarPagadoView(views.APIView):
    """
    El mesero marca a una persona específica como pagada
    dentro del desglose de la cuenta.
    """
    permission_classes = [IsAuthenticated, EsAdminOMesero]

    def patch(self, request, detalle_pago_id):
        try:
            detalle = DetallePago.objects.select_related('pago').get(
                id=detalle_pago_id)
        except DetallePago.DoesNotExist:
            return Response({'error': 'Detalle de pago no encontrado'}, status=404)

        detalle.pagado = True
        detalle.save()

        # Verificar si todos pagaron → completar el pago
        pago = detalle.pago
        todos_pagaron = not DetallePago.objects.filter(
            pago=pago, pagado=False
        ).exists()

        if todos_pagaron:
            completado  = EstadoPago.objects.get(nombre='completado')
            pago.estado = completado
            pago.save()

        return Response({
            'mensaje': 'Marcado como pagado',
            'pago_completado': todos_pagaron
        })


# ─── CONFIRMAR PAGO COMPLETO (mesero) ────────────────────────────────────────

class ConfirmarPagoMeseroView(views.APIView):
    """
    El mesero confirma que el pago fue realizado en la mesa.
    Solo después de esto la mesa puede liberarse.
    """
    permission_classes = [IsAuthenticated, EsAdminOMesero]

    def patch(self, request, pago_id):
        try:
            pago = Pago.objects.select_related('sesion').get(id=pago_id)
        except Pago.DoesNotExist:
            return Response({'error': 'Pago no encontrado'}, status=404)

        completado = EstadoPago.objects.get(nombre='completado')
        pago.estado               = completado
        pago.mesero               = request.user
        pago.confirmado_por_mesero = True
        pago.save()

        # Marcar sesión como pago confirmado para poder liberar la mesa
        sesion                 = pago.sesion
        sesion.pago_confirmado = True
        sesion.save()

        # Notificar que el pago fue confirmado
        tipo = TipoNotificacion.objects.get(nombre='pago_confirmado')
        participantes = UsuarioSesion.objects.filter(
            sesion=sesion
        ).select_related('usuario')

        for us in participantes:
            Notificacion.objects.create(
                tipo     = tipo,
                emisor   = request.user,
                receptor = us.usuario,
                sesion   = sesion,
                mensaje  = f'Pago confirmado en Mesa {sesion.mesa.numero}',
            )

        return Response({
            'mensaje': 'Pago confirmado. La mesa puede ser liberada.',
            'sesion_id': sesion.id
        })


# ─── RESUMEN COMPLETO DE LA MESA ──────────────────────────────────────────────

class ResumenCuentaMesaView(views.APIView):
    """
    Vista completa de la cuenta de una mesa:
    - Total general
    - Desglose por persona con lo que consumió cada uno
    - Adiciones por ítem
    - Descuento de depósito si aplica
    Útil para el cajero y el mesero antes de cerrar la cuenta.
    """
    permission_classes = [IsAuthenticated, EsAdminOMesero]

    def get(self, request, sesion_id):
        try:
            sesion = SesionMesa.objects.get(id=sesion_id)
        except SesionMesa.DoesNotExist:
            return Response({'error': 'Sesión no encontrada'}, status=404)

        # Total por usuario con desglose de platos
        resumen_personas = []
        pedidos = Pedido.objects.filter(
            sesion=sesion,
            estado__nombre='entregado'
        ).prefetch_related(
            'detalles__adiciones__adicion',
            'detalles__plato',
            'detalles__usuario'
        )

        usuarios_vistos = {}
        for pedido in pedidos:
            for detalle in pedido.detalles.all():
                uid = detalle.usuario_id
                if uid not in usuarios_vistos:
                    usuarios_vistos[uid] = {
                        'usuario': detalle.usuario.nombre,
                        'items':   [],
                        'subtotal': Decimal('0.00')
                    }

                # Calcular subtotal del ítem con adiciones
                subtotal_item = detalle.precio_unit * detalle.cantidad
                adiciones_info = []
                for ad in detalle.adiciones.all():
                    subtotal_item  += ad.precio_aplicado * ad.cantidad
                    adiciones_info.append({
                        'nombre':   ad.adicion.nombre,
                        'cantidad': ad.cantidad,
                        'precio':   str(ad.precio_aplicado),
                    })

                usuarios_vistos[uid]['items'].append({
                    'plato':     detalle.plato.nombre,
                    'cantidad':  detalle.cantidad,
                    'precio':    str(detalle.precio_unit),
                    'adiciones': adiciones_info,
                    'subtotal':  str(round(subtotal_item, 2)),
                })
                usuarios_vistos[uid]['subtotal'] += subtotal_item

        for uid, info in usuarios_vistos.items():
            info['subtotal'] = str(round(info['subtotal'], 2))
            resumen_personas.append(info)

        total_general = calcular_total_sesion(sesion)

        # Verificar si hay pago generado
        pago_data = None
        try:
            pago      = Pago.objects.get(sesion=sesion)
            pago_data = PagoSerializer(pago).data
        except Pago.DoesNotExist:
            pass

        return Response({
            'mesa':            sesion.mesa.numero,
            'total_general':   str(round(total_general, 2)),
            'personas':        resumen_personas,
            'pago':            pago_data,
        })
    