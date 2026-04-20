from django.db import models
from apps.catalogos.models import EstadoPedido, EstadoCancelacion, EstacionCocina
from apps.usuarios.models import Usuario
from apps.mesas.models import SesionMesa
from apps.menu.models import Plato, VariantePlato, Adicion, Ingrediente

class Pedido(models.Model):
    sesion              = models.ForeignKey(
                              SesionMesa, on_delete=models.PROTECT,
                              related_name='pedidos')
    estado              = models.ForeignKey(
                              EstadoPedido, on_delete=models.PROTECT, default=1)
    estacion            = models.ForeignKey(
                              EstacionCocina, on_delete=models.SET_NULL,
                              null=True, blank=True)
    nombre_pedido       = models.CharField(max_length=100)
    fecha               = models.DateTimeField(auto_now_add=True)
    mesero_asignado     = models.ForeignKey(
                              Usuario, on_delete=models.SET_NULL,
                              null=True, blank=True,
                              related_name='pedidos_asignados')
    aviso_mesero            = models.BooleanField(default=False)
    recibido_por_cliente    = models.BooleanField(default=False)
    fecha_entrega           = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'Pedido'

    def __str__(self):
        return self.nombre_pedido


class DetallePedido(models.Model):
    pedido              = models.ForeignKey(
                              Pedido, on_delete=models.CASCADE,
                              related_name='detalles')
    usuario             = models.ForeignKey(
                              Usuario, on_delete=models.PROTECT)
    plato               = models.ForeignKey(
                              Plato, on_delete=models.PROTECT)
    variante            = models.ForeignKey(
                              VariantePlato, on_delete=models.SET_NULL,
                              null=True, blank=True)
    cantidad            = models.IntegerField(default=1)
    precio_unit         = models.DecimalField(max_digits=10, decimal_places=2)
    notas               = models.TextField(blank=True, null=True)
    alergia_confirmada  = models.BooleanField(default=False)

    class Meta:
        db_table = 'DetallePedido'


class DetalleAdicion(models.Model):
    detalle_pedido  = models.ForeignKey(
                          DetallePedido, on_delete=models.CASCADE,
                          related_name='adiciones')
    adicion         = models.ForeignKey(Adicion, on_delete=models.PROTECT)
    cantidad        = models.IntegerField(default=1)
    precio_aplicado = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'DetalleAdicion'


class DetalleIngredienteRemovido(models.Model):
    detalle_pedido  = models.ForeignKey(
                          DetallePedido, on_delete=models.CASCADE,
                          related_name='ingredientes_removidos')
    ingrediente     = models.ForeignKey(Ingrediente, on_delete=models.PROTECT)

    class Meta:
        db_table = 'DetalleIngredienteRemovido'


class CancelacionPedido(models.Model):
    pedido          = models.ForeignKey(
                          Pedido, on_delete=models.CASCADE,
                          null=True, blank=True,
                          related_name='cancelaciones')
    detalle_pedido  = models.ForeignKey(
                          DetallePedido, on_delete=models.CASCADE,
                          null=True, blank=True)
    estado          = models.ForeignKey(
                          EstadoCancelacion, on_delete=models.PROTECT, default=1)
    motivo          = models.TextField(blank=True, null=True)
    solicitado_por  = models.ForeignKey(
                          Usuario, on_delete=models.PROTECT)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_resolucion = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'CancelacionPedido'