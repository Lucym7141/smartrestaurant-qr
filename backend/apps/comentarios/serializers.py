from rest_framework import serializers
from .models import Comentario


class ComentarioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    tipo_nombre    = serializers.CharField(source='tipo.nombre',    read_only=True)
    mesa_numero    = serializers.SerializerMethodField()

    class Meta:
        model  = Comentario
        fields = [
            'id', 'usuario_nombre', 'tipo_nombre',
            'mesa_numero', 'valoracion',
            'contenido', 'fecha', 'visible'
        ]

    def get_mesa_numero(self, obj):
        if obj.sesion:
            return obj.sesion.mesa.numero
        return None

    def validate_valoracion(self, value):
        if value is not None and not (1 <= value <= 5):
            raise serializers.ValidationError(
                'La valoración debe estar entre 1 y 5'
            )
        return value


class CrearComentarioInputSerializer(serializers.Serializer):
    sesion_id  = serializers.IntegerField(required=False, allow_null=True)
    tipo       = serializers.CharField(max_length=50)
    valoracion = serializers.IntegerField(required=False, allow_null=True)
    contenido  = serializers.CharField(min_length=5)

    def validate(self, data):
        # Si el tipo es valoración, el campo es obligatorio
        if data.get('tipo') == 'valoracion' and not data.get('valoracion'):
            raise serializers.ValidationError(
                'Las valoraciones deben incluir una puntuación del 1 al 5'
            )
        return data