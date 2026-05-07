"""
seed.py — Inicializa la base de datos de SmartRestaurant QR
Ejecutar con: python seed.py
Desde la carpeta backend/ con el entorno virtual activado.
"""
import django
import os
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.catalogos.models import (
    Rol, EstadoMesa, EstadoSesion, EstadoPedido, EstadoReserva,
    EstadoDeposito, EstadoPago, EstadoTarea, EstadoCancelacion,
    MetodoPago, TipoDivision, TipoTarea, TipoComentario,
    TipoNotificacion, TipoDestacado, EstacionCocina
)
from apps.usuarios.models import Usuario
from apps.menu.models import Ingrediente, Categoria, Plato
from apps.mesas.models import Mesa, CodigoQR

print("\n🌱 Iniciando seed de SmartRestaurant QR...\n")

# ── Roles ─────────────────────────────────────────────────────────────────────
for r in ['admin', 'mesero', 'cocina', 'cliente']:
    Rol.objects.get_or_create(nombre=r)
print("✅ Roles")

# ── Estados de mesa ───────────────────────────────────────────────────────────
for e in ['libre', 'ocupada', 'reservada', 'limpieza']:
    EstadoMesa.objects.get_or_create(nombre=e)
print("✅ Estados de mesa")

# ── Estados de sesión ─────────────────────────────────────────────────────────
for e in ['activa', 'cerrada', 'cancelada']:
    EstadoSesion.objects.get_or_create(nombre=e)
print("✅ Estados de sesión")

# ── Estados de pedido ─────────────────────────────────────────────────────────
for e in ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado']:
    EstadoPedido.objects.get_or_create(nombre=e)
print("✅ Estados de pedido")

# ── Estados de reserva ────────────────────────────────────────────────────────
for e in ['pendiente', 'confirmada', 'cancelada', 'completada']:
    EstadoReserva.objects.get_or_create(nombre=e)
print("✅ Estados de reserva")

# ── Estados de depósito ───────────────────────────────────────────────────────
for e in ['pendiente', 'recibido', 'devuelto']:
    EstadoDeposito.objects.get_or_create(nombre=e)
print("✅ Estados de depósito")

# ── Estados de pago ───────────────────────────────────────────────────────────
for e in ['pendiente', 'completado', 'fallido']:
    EstadoPago.objects.get_or_create(nombre=e)
print("✅ Estados de pago")

# ── Estados de tarea ──────────────────────────────────────────────────────────
for e in ['pendiente', 'en_progreso', 'completada', 'cancelada']:
    EstadoTarea.objects.get_or_create(nombre=e)
print("✅ Estados de tarea")

# ── Estados de cancelación ────────────────────────────────────────────────────
for e in ['cliente', 'restaurante', 'no_show']:
    EstadoCancelacion.objects.get_or_create(nombre=e)
print("✅ Estados de cancelación")

# ── Métodos de pago ───────────────────────────────────────────────────────────
for m in ['efectivo', 'tarjeta_credito', 'tarjeta_debito', 'nequi', 'daviplata', 'transferencia']:
    MetodoPago.objects.get_or_create(nombre=m)
print("✅ Métodos de pago")

# ── Tipos de división ─────────────────────────────────────────────────────────
for t in ['igualitaria', 'por_consumo', 'personalizada']:
    TipoDivision.objects.get_or_create(nombre=t)
print("✅ Tipos de división")

# ── Tipos de tarea ────────────────────────────────────────────────────────────
for t in ['agua', 'servilletas', 'cubiertos', 'cuenta', 'limpieza', 'asistencia']:
    TipoTarea.objects.get_or_create(nombre=t)
print("✅ Tipos de tarea")

# ── Tipos de comentario ───────────────────────────────────────────────────────
for t in ['comentario', 'queja', 'sugerencia', 'valoracion']:
    TipoComentario.objects.get_or_create(nombre=t)
print("✅ Tipos de comentario")

# ── Tipos de notificación ─────────────────────────────────────────────────────
for t in ['pedido', 'tarea', 'pago', 'sistema']:
    TipoNotificacion.objects.get_or_create(nombre=t)
print("✅ Tipos de notificación")

# ── Tipos de destacado ────────────────────────────────────────────────────────
for t in ['plato_del_dia', 'promocion', 'recomendacion', 'descuento']:
    TipoDestacado.objects.get_or_create(nombre=t)
print("✅ Tipos de destacado")

# ── Estaciones de cocina ──────────────────────────────────────────────────────
estaciones = [
    ('parrilla', 'Carnes y asados'),
    ('fria',     'Ensaladas, ceviches y postres'),
    ('caliente', 'Sopas, guisos y arroces'),
    ('bar',      'Bebidas y cocteles'),
]
for nombre, desc in estaciones:
    EstacionCocina.objects.get_or_create(nombre=nombre, defaults={'descripcion': desc})
print("✅ Estaciones de cocina")

# ── Usuario admin ─────────────────────────────────────────────────────────────
rol_admin = Rol.objects.get(nombre='admin')
if not Usuario.objects.filter(correo='admin@smartrestaurant.co').exists():
    admin = Usuario.objects.create_superuser(
        correo='admin@smartrestaurant.co',
        nombre='Administrador',
        password='admin123',
    )
    admin.rol = rol_admin
    admin.save()
    print("✅ Admin creado: admin@smartrestaurant.co / admin123")
else:
    print("ℹ️  Admin ya existe")

# ── Ingredientes ──────────────────────────────────────────────────────────────
ingredientes_data = [
    ('Pollo',     False), ('Res',       False), ('Camarón',  True),
    ('Gluten',    True),  ('Lácteos',   True),  ('Maíz',     False),
    ('Tomate',    False), ('Cebolla',   False), ('Ajo',      False),
    ('Cilantro',  False), ('Limón',     False), ('Aguacate', False),
]
for nombre, alergeno in ingredientes_data:
    Ingrediente.objects.get_or_create(nombre=nombre, defaults={'es_alergeno': alergeno})
print("✅ Ingredientes")

# ── Categorías y platos ───────────────────────────────────────────────────────
est_fria     = EstacionCocina.objects.get(nombre='fria')
est_parrilla = EstacionCocina.objects.get(nombre='parrilla')
est_caliente = EstacionCocina.objects.get(nombre='caliente')
est_bar      = EstacionCocina.objects.get(nombre='bar')

cat_entradas, _    = Categoria.objects.get_or_create(nombre='Entradas',        defaults={'descripcion': 'Para comenzar',                  'estacion': est_fria})
cat_principales, _ = Categoria.objects.get_or_create(nombre='Platos fuertes',  defaults={'descripcion': 'Lo mejor de nuestra cocina',        'estacion': est_parrilla})
cat_pastas, _      = Categoria.objects.get_or_create(nombre='Pastas',           defaults={'descripcion': 'Pastas frescas y al dente',          'estacion': est_caliente})
cat_sopas, _       = Categoria.objects.get_or_create(nombre='Sopas y caldos',   defaults={'descripcion': 'Reconfortantes y llenas de sabor',   'estacion': est_caliente})
cat_rapidas, _     = Categoria.objects.get_or_create(nombre='Comidas rápidas',  defaults={'descripcion': 'Rápido, rico y sin complicaciones',   'estacion': est_parrilla})
cat_snacks, _      = Categoria.objects.get_or_create(nombre='Snacks',           defaults={'descripcion': 'Para picar entre comidas',            'estacion': est_fria})
cat_bebidas, _     = Categoria.objects.get_or_create(nombre='Bebidas',          defaults={'descripcion': 'Refrescantes opciones',               'estacion': est_bar})
cat_postres, _     = Categoria.objects.get_or_create(nombre='Postres',          defaults={'descripcion': 'Para cerrar con broche de oro',       'estacion': est_fria})

platos_data = [
    # cat, nombre, desc, precio, tiempo, imagen_url
    # Entradas
    (cat_entradas,    'Bruschetta mixta',           'Tostadas con tomate fresco y albahaca',                    28000, 15, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600'),
    (cat_entradas,    'Croquetas de jamón',          'Croquetas crujientes con jamón serrano',                   31000, 12, 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600'),
    (cat_entradas,    'Ceviche de camarón',          'Camarones frescos marinados en limón y cilantro',          32000, 15, 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600'),
    (cat_entradas,    'Tabla de quesos',             'Selección de quesos nacionales con mermelada y galletas',  38000, 10, 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600'),
    (cat_entradas,    'Alitas BBQ',                  'Alitas de pollo bañadas en salsa BBQ casera',              29000, 20, 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=600'),
    (cat_entradas,    'Patacones con hogao',         'Patacones crujientes con salsa criolla y guacamole',       22000, 15, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600'),

    # Platos fuertes
    (cat_principales, 'Bandeja paisa',               'El clásico colombiano completo',                           42000, 25, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600'),
    (cat_principales, 'Pollo a la plancha',          'Pechuga jugosa con verduras asadas y papas',               36000, 20, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c1?w=600'),
    (cat_principales, 'Cazuela de mariscos',         'Mezcla de mariscos frescos en salsa de coco',              52000, 30, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600'),
    (cat_principales, 'Lomo al trapo',               'Lomo de res envuelto en sal y cocinado al fuego',          58000, 35, 'https://images.unsplash.com/photo-1558030006-450675393462?w=600'),
    (cat_principales, 'Trucha a la mantequilla',     'Trucha entera con mantequilla de hierbas y limón',         44000, 25, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600'),
    (cat_principales, 'Costillas de cerdo',          'Costillas ahumadas con salsa BBQ y puré de papa',          48000, 35, 'https://images.unsplash.com/photo-1544025162-d76694d674ed?w=600'),
    (cat_principales, 'Arroz con pollo',             'Arroz cremoso con pollo desmechado y verduras',            34000, 20, 'https://images.unsplash.com/photo-1633237308525-cd587cf71926?w=600'),

    # Pastas
    (cat_pastas,      'Spaghetti carbonara',         'Pasta con huevo, tocino, queso parmesano y pimienta',      32000, 20, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600'),
    (cat_pastas,      'Penne arrabiata',             'Penne con salsa de tomate picante y ajo',                  28000, 18, 'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=600'),
    (cat_pastas,      'Lasaña de carne',             'Capas de pasta con carne molida y bechamel gratinada',     36000, 25, 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600'),
    (cat_pastas,      'Fettuccine alfredo',          'Pasta en salsa cremosa de mantequilla y parmesano',        30000, 18, 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=600'),
    (cat_pastas,      'Pasta al pesto',              'Pasta con salsa de albahaca fresca, piñones y parmesano',  29000, 15, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600'),
    (cat_pastas,      'Rigatoni con salchicha',      'Rigatoni con salchicha italiana y salsa de tomate',        33000, 20, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600'),

    # Sopas y caldos
    (cat_sopas,       'Sancocho de gallina',         'Caldo tradicional colombiano con gallina criolla',         28000, 30, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600'),
    (cat_sopas,       'Sopa de lentejas',            'Lentejas con verduras, chorizo y especias',                22000, 25, 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=600'),
    (cat_sopas,       'Crema de champiñones',        'Crema suave de champiñones con croutons y ciboulette',     24000, 20, 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600'),
    (cat_sopas,       'Caldo de costilla',           'Caldo reconfortante con costilla de res y papas',          26000, 30, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600'),
    (cat_sopas,       'Sopa minestrone',             'Sopa italiana con verduras, pasta y tomate',               23000, 25, 'https://images.unsplash.com/photo-1584949091598-c31daaaa4aa9?w=600'),
    (cat_sopas,       'Crema de ahuyama',            'Crema de ahuyama con jengibre y leche de coco',            21000, 20, 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600'),

    # Comidas rápidas
    (cat_rapidas,     'Hamburguesa clásica',         'Carne de res, lechuga, tomate, cebolla y salsa especial',  28000, 15, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600'),
    (cat_rapidas,     'Hamburguesa BBQ',             'Doble carne, tocino, cheddar y salsa BBQ',                 35000, 15, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600'),
    (cat_rapidas,     'Hot dog especial',            'Salchicha, cebolla caramelizada, mostaza y kétchup',        18000, 10, 'https://images.unsplash.com/photo-1612392062631-94b2d6b7b67b?w=600'),
    (cat_rapidas,     'Perro con todo',              'Salchicha, papa rallada, salsas y queso derretido',         22000, 10, 'https://images.unsplash.com/photo-1612392062631-94b2d6b7b67b?w=600'),
    (cat_rapidas,     'Pizza personal margherita',   'Masa artesanal, salsa de tomate, mozzarella y albahaca',   26000, 20, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600'),
    (cat_rapidas,     'Pizza personal pepperoni',    'Masa artesanal con pepperoni y queso mozzarella',          29000, 20, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600'),
    (cat_rapidas,     'Wrap de pollo',               'Tortilla con pollo, lechuga, tomate y aderezo ranch',      24000, 12, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600'),
    (cat_rapidas,     'Taco de carne',               'Tortilla de maíz con carne molida, pico de gallo y guac',  20000, 10, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600'),

    # Snacks
    (cat_snacks,      'Papas fritas',                'Papas fritas crujientes con sal y pimienta',               12000,  8, 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600'),
    (cat_snacks,      'Papas con queso y tocino',    'Papas fritas con queso cheddar derretido y trocitos de tocino', 18000, 10, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600'),
    (cat_snacks,      'Aros de cebolla',             'Aros de cebolla empanizados y fritos',                     15000, 10, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600'),
    (cat_snacks,      'Nachos con dips',             'Nachos crujientes con guacamole, pico de gallo y queso',   22000, 10, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600'),
    (cat_snacks,      'Deditos de queso',            'Palitos de queso empanizados con salsa de ajo',            16000, 10, 'https://images.unsplash.com/photo-1548340748-6fe2c1005e5d?w=600'),
    (cat_snacks,      'Mini empanadas',              'Empanadas de pipián, carne o pollo — 6 unidades',          20000, 15, 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=600'),
    (cat_snacks,      'Yucas fritas',                'Yuca frita dorada con ají y guacamole',                    14000, 12, 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600'),

    # Bebidas
    (cat_bebidas,     'Limonada de coco',            'Limonada natural con crema de coco',                       12000,  5, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600'),
    (cat_bebidas,     'Jugo natural',                'Fruta fresca del día — maracuyá, mango, mora o guanábana', 10000,  5, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600'),
    (cat_bebidas,     'Agua de panela',              'Tradicional bebida colombiana con limón',                   8000,  3, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600'),
    (cat_bebidas,     'Café americano',              'Café negro de origen colombiano',                           7000,  5, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600'),
    (cat_bebidas,     'Cappuccino',                  'Espresso con leche vaporizada y espuma',                   10000,  5, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600'),
    (cat_bebidas,     'Malteada de fresa',           'Malteada cremosa de fresa con helado',                     16000,  8, 'https://images.unsplash.com/photo-1568901839119-631418a3910d?w=600'),
    (cat_bebidas,     'Malteada de chocolate',       'Malteada de chocolate oscuro con helado de vainilla',      16000,  8, 'https://images.unsplash.com/photo-1579954115563-e72bf1741584?w=600'),
    (cat_bebidas,     'Té frío de durazno',          'Té helado con sabor a durazno y menta fresca',             10000,  5, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600'),
    (cat_bebidas,     'Agua con gas',                'Agua mineral con gas',                                      6000,  2, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600'),
    (cat_bebidas,     'Gaseosa',                     'Coca-Cola, Sprite o Pepsi',                                 7000,  2, 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=600'),

    # Postres
    (cat_postres,     'Tres leches',                 'Esponjoso bizcocho bañado en tres leches con nata',        18000, 10, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600'),
    (cat_postres,     'Flan de coco',                'Flan cremoso con toque de coco y caramelo',                16000,  8, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600'),
    (cat_postres,     'Brownie con helado',          'Brownie de chocolate caliente con helado de vainilla',      20000, 10, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600'),
    (cat_postres,     'Cheesecake de frutos rojos',  'Cheesecake cremoso con coulis de frutos rojos',            22000, 10, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600'),
    (cat_postres,     'Helado artesanal',            'Dos bolas de helado artesanal — sabor a elección',         14000,  5, 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600'),
    (cat_postres,     'Natilla con buñuelos',        'Natilla de canela con buñuelos esponjosos',                 15000,  8, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600'),
    (cat_postres,     'Waffles con fresas',          'Waffles esponjosos con fresas frescas y crema batida',     19000, 12, 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600'),
]

for cat, nombre, desc, precio, tiempo, imagen in platos_data:
    plato, created = Plato.objects.get_or_create(nombre=nombre, defaults={
        'categoria':      cat,
        'descripcion':    desc,
        'precio_base':    precio,
        'tiempo_prep_min': tiempo,
        'disponible':     True,
        'imagen_url':     imagen,
    })
    if not created and not plato.imagen_url:
        plato.imagen_url = imagen
        plato.save()
print("✅ Categorías y platos")

# ── Mesas con QR ─────────────────────────────────────────────────────────────
estado_libre = EstadoMesa.objects.get(nombre='libre')
mesas_config = [
    (1, 4, 'Terraza',   15, 20),
    (2, 4, 'Terraza',   15, 50),
    (3, 2, 'Interior',  40, 20),
    (4, 6, 'Interior',  40, 50),
    (5, 4, 'Interior',  65, 20),
    (6, 8, 'Salón VIP', 65, 50),
]
for numero, cap, ubic, cx, cy in mesas_config:
    mesa, created = Mesa.objects.get_or_create(numero=numero, defaults={
        'capacidad':  cap,
        'ubicacion':  ubic,
        'estado':     estado_libre,
        'coord_x':    cx,
        'coord_y':    cy,
    })
    if created:
        CodigoQR.objects.create(mesa=mesa, token=str(uuid.uuid4()), activo=True)
print("✅ Mesas y códigos QR")

# ── Resumen ───────────────────────────────────────────────────────────────────
print("\n🎉 Base de datos inicializada correctamente!\n")
print("📋 Resumen:")
print(f"   Usuarios:    {Usuario.objects.count()}")
print(f"   Mesas:       {Mesa.objects.count()}")
print(f"   Categorías:  {Categoria.objects.count()} (Entradas, Platos fuertes, Pastas, Sopas, Comidas rápidas, Snacks, Bebidas, Postres)")
print(f"   Platos:      {Plato.objects.count()}")
print(f"   QRs:         {CodigoQR.objects.count()}")
print("\n🔑 Credenciales admin:")
print("   Correo:      admin@smartrestaurant.co")
print("   Contraseña:  admin123")
print("\n📱 Para ver los tokens QR de las mesas ejecuta:")
print("   python seed.py --qr\n")

# ── Mostrar QRs si se pasa el flag ────────────────────────────────────────────
import sys
if '--qr' in sys.argv:
    print("🔑 Tokens QR de las mesas:")
    for qr in CodigoQR.objects.select_related('mesa').all():
        print(f"   Mesa {qr.mesa.numero}: {qr.token}")
    print()
