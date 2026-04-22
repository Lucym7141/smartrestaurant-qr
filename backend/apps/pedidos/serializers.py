from rest_framework import serializers
from .models import (
    Pedido, DetallePedido, DetalleAdicion,
    DetalleIngredienteRemovido, CancelacionPedido
)
from apps.menu.serializers import PlatoListSerializer, AdicionSerializer
from apps.usuarios.models import AlergiaCliente


class DetalleAdicionSerializer(serializers.ModelSerializer):
    adicion_nombre  = serializers.CharField(source='adicion.nombre', read_only=True)
    adicion_precio  = serializers.DecimalField(
                          source='adicion.precio',
                          max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = DetalleAdicion
        fields = ['id', 'adicion', 'adicion_nombre', 'adicion_precio',
                  'cantidad', 'precio_aplicado']


class IngredienteRemovidoSerializer(serializers.ModelSerializer):
    ingrediente_nombre = serializers.CharField(
                             source='ingrediente.nombre', read_only=True)

    class Meta:
        model  = DetalleIngredienteRemovido
        fields = ['id', 'ingrediente', 'ingrediente_nombre']


class DetallePedidoSerializer(serializers.ModelSerializer):
    """
    Serializer de lectura — muestra el detalle completo de un ítem
    incluyendo adiciones agregadas e ingredientes removidos.
    """
    plato_nombre        = serializers.CharField(source='plato.nombre', read_only=True)
    variante_nombre     = serializers.CharField(
                              source='variante.nombre', read_only=True,
                              default=None)
    usuario_nombre      = serializers.CharField(source='usuario.nombre', read_only=True)
    adiciones           = DetalleAdicionSerializer(many=True, read_only=True)
    ingredientes_removidos = IngredienteRemovidoSerializer(many=True, read_only=True)
    subtotal            = serializers.SerializerMethodField()

    class Meta:
        model  = DetallePedido
        fields = [
            'id', 'usuario_nombre', 'plato', 'plato_nombre',
            'variante', 'variante_nombre', 'cantidad',
            'precio_unit', 'notas', 'alergia_confirmada',
            'adiciones', 'ingredientes_removidos', 'subtotal'
        ]

    def get_subtotal(self, obj):
        # precio base × cantidad
        total = obj.precio_unit * obj.cantidad
        # sumar adiciones
        for adicion in obj.adiciones.all():
            total += adicion.precio_aplicado * adicion.cantidad
        return round(total, 2)


class PedidoSerializer(serializers.ModelSerializer):
    """Serializer de lectura del pedido completo."""
    estado_nombre    = serializers.CharField(source='estado.nombre', read_only=True)
    estacion_nombre  = serializers.CharField(
                           source='estacion.nombre', read_only=True, default=None)
    mesero_nombre    = serializers.CharField(
                           source='mesero_asignado.nombre', read_only=True, default=None)
    detalles         = DetallePedidoSerializer(many=True, read_only=True)
    total_pedido     = serializers.SerializerMethodField()

    class Meta:
        model  = Pedido
        fields = [
            'id', 'nombre_pedido', 'estado_nombre', 'estacion_nombre',
            'mesero_nombre', 'fecha', 'aviso_mesero',
            'recibido_por_cliente', 'fecha_entrega',
            'detalles', 'total_pedido'
        ]

    def get_total_pedido(self, obj):
        total = 0
        for detalle in obj.detalles.all():
            total += detalle.precio_unit * detalle.cantidad
            for adicion in detalle.adiciones.all():
                total += adicion.precio_aplicado * adicion.cantidad
        return round(total, 2)


# ─── SERIALIZERS DE ESCRITURA ─────────────────────────────────────────────────

class DetalleAdicionInputSerializer(serializers.Serializer):
    """Input para agregar una adición a un ítem del pedido."""
    adicion_id = serializers.IntegerField()
    cantidad   = serializers.IntegerField(min_value=1, default=1)


class DetallePedidoInputSerializer(serializers.Serializer):
    """
    Input para cada ítem del pedido.
    El cliente especifica el plato, variante opcional,
    adiciones, ingredientes a remover y notas al cocinero.
    """
    plato_id               = serializers.IntegerField()
    variante_id            = serializers.IntegerField(required=False, allow_null=True)
    cantidad               = serializers.IntegerField(min_value=1, default=1)
    notas                  = serializers.CharField(required=False, allow_blank=True)
    alergia_confirmada     = serializers.BooleanField(default=False)
    adiciones              = DetalleAdicionInputSerializer(many=True, required=False)
    ingredientes_a_remover = serializers.ListField(
                                 child=serializers.IntegerField(),
                                 required=False
                             )


class CrearPedidoInputSerializer(serializers.Serializer):
    """Input completo para crear un pedido desde la mesa."""
    sesion_id = serializers.IntegerField()
    items     = DetallePedidoInputSerializer(many=True, min_length=1)


class CancelacionPedidoSerializer(serializers.ModelSerializer):
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)

    class Meta:
        model  = CancelacionPedido
        fields = ['id', 'pedido', 'detalle_pedido', 'estado_nombre',
                  'motivo', 'fecha_solicitud', 'fecha_resolucion']