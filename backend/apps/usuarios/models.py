from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from apps.catalogos.models import Rol, EstacionCocina


class UsuarioManager(BaseUserManager):
    def create_user(self, correo, nombre, password, id_rol, **extra):
        if not correo:
            raise ValueError('El correo es obligatorio')
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, nombre=nombre,
                          rol_id=id_rol, **extra)
        user.set_password(password)  # encripta automáticamente
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, nombre, password, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(correo, nombre, password, id_rol=4, **extra)


class Usuario(AbstractBaseUser, PermissionsMixin):
    nombre         = models.CharField(max_length=100)
    correo         = models.EmailField(max_length=150, unique=True)
    rol            = models.ForeignKey(
                         Rol, on_delete=models.PROTECT,
                         related_name='usuarios')
    fecha_registro = models.DateTimeField(auto_now_add=True)
    activo         = models.BooleanField(default=True)
    is_staff       = models.BooleanField(default=False)

    # ✅ Estas dos líneas resuelven el conflicto
    groups = models.ManyToManyField(
        'auth.Group',
        blank=True,
        related_name='usuarios_set'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        blank=True,
        related_name='usuarios_set'
    )

    USERNAME_FIELD  = 'correo'
    REQUIRED_FIELDS = ['nombre']

    objects = UsuarioManager()

    class Meta:
        db_table = 'Usuario'

    def __str__(self):
        return f'{self.nombre} ({self.rol})'


class PerfilCliente(models.Model):
    usuario          = models.OneToOneField(
                           Usuario, on_delete=models.CASCADE,
                           related_name='perfil')
    telefono         = models.CharField(max_length=20, blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)

    class Meta:
        db_table = 'PerfilCliente'


class AlergiaCliente(models.Model):
    usuario        = models.ForeignKey(
                         Usuario, on_delete=models.CASCADE,
                         related_name='alergias')
    ingrediente    = models.ForeignKey(
                         'menu.Ingrediente', on_delete=models.CASCADE)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'AlergiaCliente'
        unique_together = ('usuario', 'ingrediente')


class CocineroEstacion(models.Model):
    usuario          = models.ForeignKey(
                           Usuario, on_delete=models.CASCADE,
                           related_name='estaciones')
    estacion         = models.ForeignKey(
                           EstacionCocina, on_delete=models.PROTECT)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    activo           = models.BooleanField(default=True)

    class Meta:
        db_table = 'CocineroEstacion'
        unique_together = ('usuario', 'estacion')