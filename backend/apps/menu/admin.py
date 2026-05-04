from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Categoria, Plato, Ingrediente, Adicion, Destacado

admin.site.register(Categoria)
admin.site.register(Plato)
admin.site.register(Ingrediente)
admin.site.register(Adicion)
admin.site.register(Destacado)