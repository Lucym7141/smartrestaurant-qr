from django.db import models
from apps.catalogos.models import EstadoPago, MetodoPago, TipoDivision
from apps.usuarios.models import Usuario
from apps.mesas.models import SesionMesa

class Pago(models.Model):
    sesion                  = models.ForeignKey(
                                  SesionMesa, on_delete=models.PROTECT,
                                  related_name='pagos')
    cajero                  = models.ForeignKey(
                                  Usuario, on_delete=models.SET_NULL,
                                  null=True, blank=True,
                                  related_name='pagos_cajero')
    mesero                  = models.ForeignKey(
                                  Usuario, on_delete=models.SET_NULL,
                                  null=True, blank=True,
                                  related_name='pagos_mesero')
    estado                  = models.ForeignKey(
                                  EstadoPago, on_delete=models.PROTECT, default=1)
    metodo                  = models.ForeignKey(
                                  MetodoPago, on_delete=models.PROTECT)
    tipo_division           = models.ForeignKey(
                                  TipoDivision, on_delete=models.PROTECT)
    total                   = models.DecimalField(max_digits=10, decimal_places=2)
    deposito_descontado     = models.DecimalField(
                                  max_digits=10, decimal_places=2, default=0.00)
    total_final             = models.DecimalField(max_digits=10, decimal_places=2)
    fecha                   = models.DateTimeField(auto_now_add=True)
    confirmado_por_mesero   = models.BooleanField(default=False)

    class Meta:
        db_table = 'Pago'

    def __str__(self):
        return f'Pago {self.id} - Mesa {self.sesion.mesa.numero}'


class DetallePago(models.Model):
    pago    = models.ForeignKey(
                  Pago, on_delete=models.CASCADE,
                  related_name='detalles')
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT)
    monto   = models.DecimalField(max_digits=10, decimal_places=2)
    pagado  = models.BooleanField(default=False)

    class Meta:
        db_table = 'DetallePago'