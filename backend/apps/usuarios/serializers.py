from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario, PerfilCliente, AlergiaCliente


class TokenPersonalizadoSerializer(TokenObtainPairSerializer):
    """Agrega datos del usuario al token JWT para que el frontend
    sepa el rol sin hacer una petición extra."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['nombre'] = user.nombre
        token['correo'] = user.correo
        token['rol']    = user.rol.nombre
        return token


class RegistroClienteSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8)
    telefono         = serializers.CharField(required=False)
    fecha_nacimiento = serializers.DateField(required=False)

    class Meta:
        model  = Usuario
        fields = ['nombre', 'correo', 'password', 'telefono', 'fecha_nacimiento']

    def create(self, validated_data):
        telefono         = validated_data.pop('telefono', None)
        fecha_nacimiento = validated_data.pop('fecha_nacimiento', None)

        usuario = Usuario.objects.create_user(
            correo   = validated_data['correo'],
            nombre   = validated_data['nombre'],
            password = validated_data['password'],
            id_rol   = 1,  # rol cliente por defecto
        )

        PerfilCliente.objects.create(
            usuario          = usuario,
            telefono         = telefono,
            fecha_nacimiento = fecha_nacimiento,
        )
        return usuario


class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.StringRelatedField()

    class Meta:
        model  = Usuario
        fields = ['id', 'nombre', 'correo', 'rol', 'activo', 'fecha_registro']


class AlergiaClienteSerializer(serializers.ModelSerializer):
    ingrediente_nombre = serializers.CharField(
        source='ingrediente.nombre', read_only=True)

    class Meta:
        model  = AlergiaCliente
        fields = ['id', 'ingrediente', 'ingrediente_nombre', 'fecha_registro']