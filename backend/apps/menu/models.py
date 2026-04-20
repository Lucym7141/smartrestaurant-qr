from django.db import models
from apps.catalogos.models import EstacionCocina

class Ingrediente(models.Model):
    nombre      = models.CharField(max_length=100, unique=True)
    es_alergeno = models.BooleanField(default=False)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'Ingrediente'

    def __str__(self):
        return self.nombre


class Categoria(models.Model):
    nombre      = models.CharField(max_length=100, unique=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    imagen_url  = models.URLField(max_length=500, blank=True, null=True)
    estacion    = models.ForeignKey(
                      EstacionCocina, on_delete=models.SET_NULL,
                      null=True, blank=True)

    class Meta:
        db_table = 'Categoria'

    def __str__(self):
        return self.nombre


class Plato(models.Model):
    categoria       = models.ForeignKey(
                          Categoria, on_delete=models.PROTECT,
                          related_name='platos')
    nombre          = models.CharField(max_length=150)
    descripcion     = models.TextField(blank=True, null=True)
    precio_base     = models.DecimalField(max_digits=10, decimal_places=2)
    imagen_url      = models.URLField(max_length=500, blank=True, null=True)
    modelo_ar_url   = models.URLField(max_length=500, blank=True, null=True)
    tiempo_prep_min = models.IntegerField(blank=True, null=True)
    disponible      = models.BooleanField(default=True)

    class Meta:
        db_table = 'Plato'

    def __str__(self):
        return self.nombre


class PlatoIngrediente(models.Model):
    plato       = models.ForeignKey(
                      Plato, on_delete=models.CASCADE,
                      related_name='ingredientes')
    ingrediente = models.ForeignKey(
                      Ingrediente, on_delete=models.PROTECT)
    es_removible = models.BooleanField(default=False)

    class Meta:
        db_table = 'PlatoIngrediente'
        unique_together = ('plato', 'ingrediente')


class Adicion(models.Model):
    nombre      = models.CharField(max_length=100)
    precio      = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    disponible  = models.BooleanField(default=True)

    class Meta:
        db_table = 'Adicion'

    def __str__(self):
        return f'{self.nombre} (+${self.precio})'


class PlatoAdicion(models.Model):
    plato   = models.ForeignKey(
                  Plato, on_delete=models.CASCADE,
                  related_name='adiciones')
    adicion = models.ForeignKey(
                  Adicion, on_delete=models.CASCADE)

    class Meta:
        db_table = 'PlatoAdicion'
        unique_together = ('plato', 'adicion')


class VariantePlato(models.Model):
    plato       = models.ForeignKey(
                      Plato, on_delete=models.CASCADE,
                      related_name='variantes')
    nombre      = models.CharField(max_length=100)
    precio_extra = models.DecimalField(
                       max_digits=10, decimal_places=2, default=0.00)
    disponible  = models.BooleanField(default=True)

    class Meta:
        db_table = 'VariantePlato'

    def __str__(self):
        return f'{self.plato.nombre} - {self.nombre}'


class Destacado(models.Model):
    tipo            = models.ForeignKey(
                          'catalogos.TipoDestacado', on_delete=models.PROTECT)
    plato           = models.ForeignKey(
                          Plato, on_delete=models.SET_NULL,
                          null=True, blank=True)
    titulo          = models.CharField(max_length=150)
    descripcion     = models.TextField(blank=True, null=True)
    imagen_url      = models.URLField(max_length=500, blank=True, null=True)
    descuento_pct   = models.DecimalField(
                          max_digits=5, decimal_places=2,
                          blank=True, null=True)
    precio_promo    = models.DecimalField(
                          max_digits=10, decimal_places=2,
                          blank=True, null=True)
    fecha_inicio    = models.DateField()
    fecha_fin       = models.DateField(blank=True, null=True)
    activo          = models.BooleanField(default=True)

    class Meta:
        db_table = 'Destacado'

    def __str__(self):
        return self.titulo