from django.contrib import admin
from .models import Categoria, Plato, Ingrediente, Adicion, Destacado, VariantePlato

@admin.register(Plato)
class PlatoAdmin(admin.ModelAdmin):
    list_display  = ['nombre', 'categoria', 'precio_base', 'disponible']
    list_filter   = ['categoria', 'disponible']
    search_fields = ['nombre']
    list_editable = ['precio_base', 'disponible']

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'descripcion']

@admin.register(Ingrediente)
class IngredienteAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'es_alergeno']

@admin.register(Adicion)
class AdicionAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'precio', 'disponible']

@admin.register(Destacado)
class DestacadoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo', 'activo', 'fecha_inicio']

@admin.register(VariantePlato)
class VariantePlatoAdmin(admin.ModelAdmin):
    list_display = ['plato', 'nombre', 'precio_extra', 'disponible']