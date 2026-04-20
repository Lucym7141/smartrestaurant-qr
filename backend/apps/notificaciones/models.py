from django.db import models
from apps.catalogos.models import TipoNotificacion
from apps.usuarios.models import Usuario
from apps.mesas.models import SesionMesa
from apps.pedidos.models import Pedido

class Notificacion(models.Model):
    tipo        = models.ForeignKey(TipoNotificacion, on_delete=models.PROTECT)
    emisor      = models.ForeignKey(
                      Usuario, on_delete=models.PROTECT,
                      related_name='notificaciones_enviadas')
    receptor    = models.ForeignKey(
                      Usuario, on_delete=models.PROTECT,
                      related_name='notificaciones_recibidas')
    pedido      = models.ForeignKey(
                      Pedido, on_delete=models.SET_NULL,
                      null=True, blank=True)
    sesion      = models.ForeignKey(
                      SesionMesa, on_delete=models.SET_NULL,
                      null=True, blank=True)
    mensaje     = models.TextField(blank=True, null=True)
    leida       = models.BooleanField(default=False)
    fecha       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Notificacion'