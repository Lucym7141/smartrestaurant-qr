from rest_framework import serializers
from .models import Pago, DetallePago
from apps.usuarios.models import Usuario


class DetallePagoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)

    class Meta:
        model  = DetallePago
        fields = ['id', 'usuario_nombre', 'monto', 'pagado']


class PagoSerializer(serializers.ModelSerializer):
    """Serializer de lectura del pago completo con desglose por persona."""
    estado_nombre        = serializers.CharField(source='estado.nombre',        read_only=True)
    metodo_nombre        = serializers.CharField(source='metodo.nombre',        read_only=True)
    tipo_division_nombre = serializers.CharField(source='tipo_division.nombre', read_only=True)
    mesa_numero          = serializers.IntegerField(source='sesion.mesa.numero', read_only=True)
    cajero_nombre        = serializers.CharField(
                               source='cajero.nombre', read_only=True, default=None)
    mesero_nombre        = serializers.CharField(
                               source='mesero.nombre', read_only=True, default=None)
    detalles             = DetallePagoSerializer(many=True, read_only=True)

    class Meta:
        model  = Pago
        fields = [
            'id', 'mesa_numero', 'estado_nombre', 'metodo_nombre',
            'tipo_division_nombre', 'cajero_nombre', 'mesero_nombre',
            'total', 'deposito_descontado', 'total_final',
            'fecha', 'confirmado_por_mesero', 'detalles'
        ]


# ─── SERIALIZERS DE ESCRITURA ─────────────────────────────────────────────────

class GenerarPagoInputSerializer(serializers.Serializer):
    """
    Input para generar el pago de una sesión.
    El sistema calcula automáticamente los montos según el tipo de división.
    """
    sesion_id        = serializers.IntegerField()
    tipo_division    = serializers.ChoiceField(choices=['individual', 'igualitaria'])
    metodo_pago      = serializers.CharField(max_length=50)

    # Solo aplica si hay reserva con depósito asociado
    aplicar_deposito = serializers.BooleanField(default=False)
    reserva_id       = serializers.IntegerField(required=False, allow_null=True)