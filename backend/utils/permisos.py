from rest_framework.permissions import BasePermission


def es_rol(rol_nombre):
    """Fábrica de permisos: genera una clase de permiso para cualquier rol."""
    class PermisoRol(BasePermission):
        def has_permission(self, request, view):
            return (
                request.user and
                request.user.is_authenticated and
                request.user.rol is not None and
                request.user.rol.nombre == rol_nombre
            )
    PermisoRol.__name__ = f'Es{rol_nombre.capitalize()}'
    return PermisoRol


# Permisos listos para usar en cualquier vista
EsCliente  = es_rol('cliente')
EsMesero   = es_rol('mesero')
EsCajero   = es_rol('cajero')
EsAdmin    = es_rol('admin')
EsCocinero = es_rol('cocina')


class EsAdminOMesero(BasePermission):
    """Para endpoints que pueden usar admin, mesero y cocina."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol is not None and
            request.user.rol.nombre in ['admin', 'mesero', 'cocina']
        )


class EsCocineroOMesero(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol is not None and
            request.user.rol.nombre in ['cocina', 'mesero', 'admin']
        )