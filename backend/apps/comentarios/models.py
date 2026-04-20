from django.db import models
from apps.catalogos.models import TipoComentario
from apps.usuarios.models import Usuario
from apps.mesas.models import SesionMesa

class Comentario(models.Model):
    usuario     = models.ForeignKey(
                      Usuario, on_delete=models.PROTECT,
                      related_name='comentarios')
    sesion      = models.ForeignKey(
                      SesionMesa, on_delete=models.SET_NULL,
                      null=True, blank=True)
    tipo        = models.ForeignKey(TipoComentario, on_delete=models.PROTECT)
    valoracion  = models.IntegerField(blank=True, null=True)  # 1 a 5
    contenido   = models.TextField()
    fecha       = models.DateTimeField(auto_now_add=True)
    visible     = models.BooleanField(default=True)

    class Meta:
        db_table = 'Comentario'

    def __str__(self):
        return f'{self.tipo} - {self.usuario.nombre}'