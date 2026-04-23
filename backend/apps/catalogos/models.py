from django.db import models

class Rol(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'Rol'

    def __str__(self):
        return self.nombre


class EstadoMesa(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'EstadoMesa'

    def __str__(self):
        return self.nombre


class EstadoSesion(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'EstadoSesion'

    def __str__(self):
        return self.nombre


class EstadoPedido(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'EstadoPedido'

    def __str__(self):
        return self.nombre


class EstadoReserva(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'EstadoReserva'

    def __str__(self):
        return self.nombre


class EstadoDeposito(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'EstadoDeposito'

    def __str__(self):
        return self.nombre


class EstadoPago(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'EstadoPago'

    def __str__(self):
        return self.nombre


class EstadoTarea(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'EstadoTarea'

    def __str__(self):
        return self.nombre


class EstadoCancelacion(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'EstadoCancelacion'

    def __str__(self):
        return self.nombre


class MetodoPago(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'MetodoPago'

    def __str__(self):
        return self.nombre


class TipoDivision(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'TipoDivision'

    def __str__(self):
        return self.nombre


class TipoTarea(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'TipoTarea'

    def __str__(self):
        return self.nombre


class TipoComentario(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'TipoComentario'

    def __str__(self):
        return self.nombre


class TipoNotificacion(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'TipoNotificacion'

    def __str__(self):
        return self.nombre


class TipoDestacado(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'TipoDestacado'

    def __str__(self):
        return self.nombre


class EstacionCocina(models.Model):
    nombre      = models.CharField(max_length=100, unique=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'EstacionCocina'

    def __str__(self):
        return self.nombre