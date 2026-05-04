from rest_framework import serializers
from .models import Mesa, CodigoQR, SesionMesa, UsuarioSesion, TareaMesero
from apps.catalogos.models import EstadoMesa


class MesaSerializer(serializers.ModelSerializer):
    """Vista completa de una mesa para el mapa virtual."""
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)

    class Meta:
        model  = Mesa
        fields = [
            'id', 'numero', 'capacidad', 'ubicacion',
            'estado_nombre', 'coord_x', 'coord_y'
        ]


class MesaMapaSerializer(serializers.ModelSerializer):
    estado_nombre    = serializers.CharField(source='estado.nombre', read_only=True)
    sesion_activa_id = serializers.SerializerMethodField()
    ubicacion        = serializers.CharField(read_only=True)

    class Meta:
        model  = Mesa
        fields = ['id', 'numero', 'capacidad', 'ubicacion', 'estado_nombre',
                  'coord_x', 'coord_y', 'sesion_activa_id']

    def get_sesion_activa_id(self, obj):
        sesion = SesionMesa.objects.filter(
            mesa=obj, estado__nombre='activa'
        ).first()
        return sesion.id if sesion else None

class CodigoQRSerializer(serializers.ModelSerializer):
    mesa_numero = serializers.IntegerField(source='mesa.numero', read_only=True)

    class Meta:
        model  = CodigoQR
        fields = ['id', 'mesa_numero', 'token', 'activo']


class UsuarioSesionSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    usuario_correo = serializers.CharField(source='usuario.correo', read_only=True)

    class Meta:
        model  = UsuarioSesion
        fields = ['id', 'usuario_nombre', 'usuario_correo', 'fecha_union']


class SesionMesaSerializer(serializers.ModelSerializer):
    mesa_numero   = serializers.IntegerField(source='mesa.numero', read_only=True)
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    participantes = UsuarioSesionSerializer(many=True, read_only=True)

    class Meta:
        model  = SesionMesa
        fields = [
            'id', 'mesa_numero', 'estado_nombre',
            'fecha_inicio', 'fecha_fin',
            'pago_confirmado', 'participantes'
        ]


class TareaMeseroSerializer(serializers.ModelSerializer):
    tipo_nombre         = serializers.CharField(source='tipo.nombre', read_only=True)
    estado_nombre       = serializers.CharField(source='estado.nombre', read_only=True)
    mesa_numero         = serializers.IntegerField(
                              source='sesion.mesa.numero', read_only=True)
    solicitado_por_nombre = serializers.CharField(
                              source='solicitado_por.nombre', read_only=True)

    class Meta:
        model  = TareaMesero
        fields = [
            'id', 'mesa_numero', 'tipo_nombre', 'estado_nombre',
            'solicitado_por_nombre', 'notas',
            'fecha_creacion', 'fecha_completada'
        ]