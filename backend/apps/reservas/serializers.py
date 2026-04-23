from rest_framework import serializers
from .models import Reserva
from apps.mesas.models import Mesa
from django.utils import timezone
from datetime import timedelta


class ReservaSerializer(serializers.ModelSerializer):
    """Serializer de lectura completo de una reserva."""
    usuario_nombre       = serializers.CharField(source='usuario.nombre',         read_only=True)
    usuario_correo       = serializers.CharField(source='usuario.correo',         read_only=True)
    mesa_numero          = serializers.IntegerField(source='mesa.numero',         read_only=True)
    mesa_capacidad       = serializers.IntegerField(source='mesa.capacidad',      read_only=True)
    estado_nombre        = serializers.CharField(source='estado.nombre',          read_only=True)
    estado_deposito_nombre = serializers.CharField(
                                source='estado_deposito.nombre', read_only=True)
    recibido_por         = serializers.CharField(
                                source='usuario_recepcion.nombre',
                                read_only=True, default=None)
    puede_cancelar_con_devolucion = serializers.SerializerMethodField()

    class Meta:
        model  = Reserva
        fields = [
            'id', 'usuario_nombre', 'usuario_correo',
            'mesa_numero', 'mesa_capacidad',
            'estado_nombre', 'estado_deposito_nombre',
            'fecha_reserva', 'num_personas', 'notas',
            'deposito_por_persona', 'deposito_total',
            'fecha_creacion', 'fecha_cancelacion',
            'devolucion_aplicada', 'recibido_por',
            'puede_cancelar_con_devolucion'
        ]

    def get_puede_cancelar_con_devolucion(self, obj):
        """
        Indica al cliente si aún puede cancelar
        con devolución (≥ 40 min antes).
        """
        if obj.estado.nombre in ['cancelada', 'completada']:
            return False
        ahora      = timezone.now()
        diferencia = obj.fecha_reserva - ahora
        return diferencia >= timedelta(minutes=40)


class CrearReservaInputSerializer(serializers.Serializer):
    """Input para crear una reserva con depósito opcional."""
    mesa_id              = serializers.IntegerField()
    fecha_reserva        = serializers.DateTimeField()
    num_personas         = serializers.IntegerField(min_value=1)
    notas                = serializers.CharField(required=False, allow_blank=True)
    deposito_por_persona = serializers.DecimalField(
                               max_digits=10, decimal_places=2,
                               min_value=0, default=0)

    def validate(self, data):
        # Validar que la fecha de reserva sea futura
        if data['fecha_reserva'] <= timezone.now():
            raise serializers.ValidationError(
                'La fecha de reserva debe ser en el futuro'
            )

        # Validar que la mesa tenga capacidad suficiente
        try:
            mesa = Mesa.objects.get(id=data['mesa_id'])
        except Mesa.DoesNotExist:
            raise serializers.ValidationError('Mesa no encontrada')

        if data['num_personas'] > mesa.capacidad:
            raise serializers.ValidationError(
                f'La mesa {mesa.numero} solo tiene capacidad para {mesa.capacidad} personas'
            )

        return data


class CancelarReservaInputSerializer(serializers.Serializer):
    motivo = serializers.CharField(required=False, allow_blank=True)