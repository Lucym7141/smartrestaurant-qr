from django.db import models
from apps.catalogos.models import EstadoMesa, EstadoSesion, EstadoTarea, TipoTarea
from apps.usuarios.models import Usuario

class Mesa(models.Model):
    numero    = models.IntegerField(unique=True)
    capacidad = models.IntegerField()
    ubicacion = models.CharField(max_length=100, blank=True, null=True)
    estado    = models.ForeignKey(
                    EstadoMesa, on_delete=models.PROTECT, default=1)
    coord_x   = models.FloatField()
    coord_y   = models.FloatField()

    class Meta:
        db_table = 'Mesa'

    def __str__(self):
        return f'Mesa {self.numero}'


class CodigoQR(models.Model):
    mesa            = models.OneToOneField(
                          Mesa, on_delete=models.CASCADE,
                          related_name='qr')
    token           = models.CharField(max_length=255, unique=True)
    fecha_creacion  = models.DateTimeField(auto_now_add=True)
    activo          = models.BooleanField(default=True)

    class Meta:
        db_table = 'CodigoQR'

    def __str__(self):
        return f'QR Mesa {self.mesa.numero}'


class SesionMesa(models.Model):
    mesa            = models.ForeignKey(
                          Mesa, on_delete=models.PROTECT,
                          related_name='sesiones')
    estado          = models.ForeignKey(
                          EstadoSesion, on_delete=models.PROTECT, default=1)
    fecha_inicio    = models.DateTimeField(auto_now_add=True)
    fecha_fin       = models.DateTimeField(blank=True, null=True)
    pago_confirmado = models.BooleanField(default=False)

    class Meta:
        db_table = 'SesionMesa'

    def __str__(self):
        return f'Sesión {self.id} - Mesa {self.mesa.numero}'


class UsuarioSesion(models.Model):
    sesion      = models.ForeignKey(
                      SesionMesa, on_delete=models.CASCADE,
                      related_name='participantes')
    usuario     = models.ForeignKey(
                      Usuario, on_delete=models.CASCADE)
    fecha_union = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'UsuarioSesion'
        unique_together = ('sesion', 'usuario')


class TareaMesero(models.Model):
    sesion              = models.ForeignKey(
                              SesionMesa, on_delete=models.CASCADE,
                              related_name='tareas')
    mesero              = models.ForeignKey(
                              Usuario, on_delete=models.SET_NULL,
                              null=True, blank=True,
                              related_name='tareas_asignadas')
    tipo                = models.ForeignKey(TipoTarea, on_delete=models.PROTECT)
    estado              = models.ForeignKey(EstadoTarea, on_delete=models.PROTECT, default=1)
    solicitado_por      = models.ForeignKey(
                              Usuario, on_delete=models.PROTECT,
                              related_name='tareas_solicitadas')
    fecha_creacion      = models.DateTimeField(auto_now_add=True)
    fecha_completada    = models.DateTimeField(blank=True, null=True)
    notas               = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'TareaMesero'