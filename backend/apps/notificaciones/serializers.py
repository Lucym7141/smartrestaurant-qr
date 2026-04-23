from rest_framework import serializers
from .models import Notificacion


class NotificacionSerializer(serializers.ModelSerializer):
    tipo_nombre    = serializers.CharField(source='tipo.nombre',   read_only=True)
    emisor_nombre  = serializers.CharField(source='emisor.nombre', read_only=True)
    mesa_numero    = serializers.SerializerMethodField()
    pedido_nombre  = serializers.CharField(
                         source='pedido.nombre_pedido',
                         read_only=True, default=None)

    class Meta:
        model  = Notificacion
        fields = [
            'id', 'tipo_nombre', 'emisor_nombre',
            'mesa_numero', 'pedido_nombre',
            'mensaje', 'leida', 'fecha'
        ]

    def get_mesa_numero(self, obj):
        if obj.sesion:
            return obj.sesion.mesa.numero
        return None