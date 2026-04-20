from django.db import models
from apps.catalogos.models import EstadoReserva, EstadoDeposito
from apps.usuarios.models import Usuario
from apps.mesas.models import Mesa

class Reserva(models.Model):
    usuario             = models.ForeignKey(
                              Usuario, on_delete=models.PROTECT,
                              related_name='reservas')
    mesa                = models.ForeignKey(
                              Mesa, on_delete=models.PROTECT,
                              related_name='reservas')
    estado              = models.ForeignKey(
                              EstadoReserva, on_delete=models.PROTECT, default=1)
    fecha_reserva       = models.DateTimeField()
    num_personas        = models.IntegerField()
    notas               = models.TextField(blank=True, null=True)
    fecha_creacion      = models.DateTimeField(auto_now_add=True)
    deposito_por_persona = models.DecimalField(
                               max_digits=10, decimal_places=2, default=0.00)
    deposito_total      = models.DecimalField(
                               max_digits=10, decimal_places=2, default=0.00)
    estado_deposito     = models.ForeignKey(
                               EstadoDeposito, on_delete=models.PROTECT, default=1)
    fecha_cancelacion   = models.DateTimeField(blank=True, null=True)
    devolucion_aplicada = models.BooleanField(default=False)
    usuario_recepcion   = models.ForeignKey(
                               Usuario, on_delete=models.SET_NULL,
                               null=True, blank=True,
                               related_name='reservas_recibidas')

    class Meta:
        db_table = 'Reserva'

    def __str__(self):
        return f'Reserva {self.id} - {self.usuario.nombre} - Mesa {self.mesa.numero}'

    def puede_cancelar_con_devolucion(self):
        from django.utils import timezone
        from datetime import timedelta
        if self.fecha_cancelacion and self.fecha_reserva:
            diferencia = self.fecha_reserva - self.fecha_cancelacion
            return diferencia >= timedelta(minutes=40)
        return False