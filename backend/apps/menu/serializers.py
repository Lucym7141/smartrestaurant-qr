from rest_framework import serializers
from .models import (
    Ingrediente, Categoria, Plato, PlatoIngrediente,
    Adicion, PlatoAdicion, VariantePlato, Destacado
)


class IngredienteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Ingrediente
        fields = ['id', 'nombre', 'es_alergeno', 'descripcion']


class AdicionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Adicion
        fields = ['id', 'nombre', 'precio', 'descripcion', 'disponible']


class VariantePlatoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VariantePlato
        fields = ['id', 'nombre', 'precio_extra', 'disponible']


class PlatoIngredienteSerializer(serializers.ModelSerializer):
    id          = serializers.IntegerField(source='ingrediente.id')
    nombre      = serializers.CharField(source='ingrediente.nombre')
    es_alergeno = serializers.BooleanField(source='ingrediente.es_alergeno')
    descripcion = serializers.CharField(source='ingrediente.descripcion')

    class Meta:
        model  = PlatoIngrediente
        fields = ['id', 'nombre', 'es_alergeno', 'descripcion', 'es_removible']


class PlatoListSerializer(serializers.ModelSerializer):
    """Vista resumida para listar platos en el menú."""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)

    class Meta:
        model  = Plato
        fields = [
            'id', 'nombre', 'descripcion', 'precio_base',
            'imagen_url', 'modelo_ar_url', 'disponible',
            'categoria_nombre', 'tiempo_prep_min'
        ]


class PlatoDetalleSerializer(serializers.ModelSerializer):
    """Vista completa de un plato con ingredientes, adiciones y variantes."""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    ingredientes     = PlatoIngredienteSerializer(many=True, read_only=True)
    variantes        = VariantePlatoSerializer(many=True, read_only=True)
    adiciones        = serializers.SerializerMethodField()

    class Meta:
        model  = Plato
        fields = [
            'id', 'nombre', 'descripcion', 'precio_base',
            'imagen_url', 'modelo_ar_url', 'tiempo_prep_min',
            'disponible', 'categoria_nombre',
            'ingredientes', 'variantes', 'adiciones'
        ]

    def get_adiciones(self, obj):
        # Solo adiciones disponibles y compatibles con este plato
        adiciones = Adicion.objects.filter(
            platoadicion__plato=obj,
            disponible=True
        )
        return AdicionSerializer(adiciones, many=True).data


class CategoriaSerializer(serializers.ModelSerializer):
    """Categoría con todos sus platos disponibles."""
    platos = serializers.SerializerMethodField()

    class Meta:
        model  = Categoria
        fields = ['id', 'nombre', 'descripcion', 'imagen_url', 'platos']

    def get_platos(self, obj):
        platos = obj.platos.filter(disponible=True)
        return PlatoListSerializer(platos, many=True).data


class DestacadoSerializer(serializers.ModelSerializer):
    tipo_nombre  = serializers.CharField(source='tipo.nombre', read_only=True)
    plato_nombre = serializers.CharField(source='plato.nombre', read_only=True)
    plato_imagen = serializers.URLField(source='plato.imagen_url', read_only=True)

    class Meta:
        model  = Destacado
        fields = [
            'id', 'tipo_nombre', 'titulo', 'descripcion',
            'imagen_url', 'descuento_pct', 'precio_promo',
            'fecha_inicio', 'fecha_fin', 'plato_nombre', 'plato_imagen'
        ]