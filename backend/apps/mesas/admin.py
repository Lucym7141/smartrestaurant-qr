from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Mesa, CodigoQR, SesionMesa

admin.site.register(Mesa)
admin.site.register(CodigoQR)
admin.site.register(SesionMesa)