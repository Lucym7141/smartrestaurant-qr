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
for t in ['pedido', 'tarea', 'pago', 'sistema', 'nuevo_pedido', 'pedido_listo', 'pago_confirmado']:
    TipoNotificacion.objects.get_or_create(nombre=t)
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
    # Entradas
    (cat_entradas,    'Bruschetta mixta',           'Tostadas con tomate fresco y albahaca',                    28000, 15),
    (cat_entradas,    'Croquetas de jamón',          'Croquetas crujientes con jamón serrano',                   31000, 12),
    (cat_entradas,    'Ceviche de camarón',          'Camarones frescos marinados en limón y cilantro',          32000, 15),
    (cat_entradas,    'Tabla de quesos',             'Selección de quesos nacionales con mermelada y galletas',  38000, 10),
    (cat_entradas,    'Alitas BBQ',                  'Alitas de pollo bañadas en salsa BBQ casera',              29000, 20),
    (cat_entradas,    'Patacones con hogao',         'Patacones crujientes con salsa criolla y guacamole',       22000, 15),

    # Platos fuertes
    (cat_principales, 'Bandeja paisa',               'El clásico colombiano completo',                           42000, 25),
    (cat_principales, 'Pollo a la plancha',          'Pechuga jugosa con verduras asadas y papas',               36000, 20),
    (cat_principales, 'Cazuela de mariscos',         'Mezcla de mariscos frescos en salsa de coco',              52000, 30),
    (cat_principales, 'Lomo al trapo',               'Lomo de res envuelto en sal y cocinado al fuego',          58000, 35),
    (cat_principales, 'Trucha a la mantequilla',     'Trucha entera con mantequilla de hierbas y limón',         44000, 25),
    (cat_principales, 'Costillas de cerdo',          'Costillas ahumadas con salsa BBQ y puré de papa',          48000, 35),
    (cat_principales, 'Arroz con pollo',             'Arroz cremoso con pollo desmechado y verduras',            34000, 20),

    # Pastas
    (cat_pastas,      'Spaghetti carbonara',         'Pasta con huevo, tocino, queso parmesano y pimienta',      32000, 20),
    (cat_pastas,      'Penne arrabiata',             'Penne con salsa de tomate picante y ajo',                  28000, 18),
    (cat_pastas,      'Lasaña de carne',             'Capas de pasta con carne molida y bechamel gratinada',     36000, 25),
    (cat_pastas,      'Fettuccine alfredo',          'Pasta en salsa cremosa de mantequilla y parmesano',        30000, 18),
    (cat_pastas,      'Pasta al pesto',              'Pasta con salsa de albahaca fresca, piñones y parmesano',  29000, 15),
    (cat_pastas,      'Rigatoni con salchicha',      'Rigatoni con salchicha italiana y salsa de tomate',        33000, 20),

    # Sopas y caldos
    (cat_sopas,       'Sancocho de gallina',         'Caldo tradicional colombiano con gallina criolla',         28000, 30),
    (cat_sopas,       'Sopa de lentejas',            'Lentejas con verduras, chorizo y especias',                22000, 25),
    (cat_sopas,       'Crema de champiñones',        'Crema suave de champiñones con croutons y ciboulette',     24000, 20),
    (cat_sopas,       'Caldo de costilla',           'Caldo reconfortante con costilla de res y papas',          26000, 30),
    (cat_sopas,       'Sopa minestrone',             'Sopa italiana con verduras, pasta y tomate',               23000, 25),
    (cat_sopas,       'Crema de ahuyama',            'Crema de ahuyama con jengibre y leche de coco',            21000, 20),

    # Comidas rápidas
    (cat_rapidas,     'Hamburguesa clásica',         'Carne de res, lechuga, tomate, cebolla y salsa especial',  28000, 15),
    (cat_rapidas,     'Hamburguesa BBQ',             'Doble carne, tocino, cheddar y salsa BBQ',                 35000, 15),
    (cat_rapidas,     'Hot dog especial',            'Salchicha, cebolla caramelizada, mostaza y kétchup',        18000, 10),
    (cat_rapidas,     'Perro con todo',              'Salchicha, papa rallada, salsas y queso derretido',         22000, 10),
    (cat_rapidas,     'Pizza personal margherita',   'Masa artesanal, salsa de tomate, mozzarella y albahaca',   26000, 20),
    (cat_rapidas,     'Pizza personal pepperoni',    'Masa artesanal con pepperoni y queso mozzarella',          29000, 20),
    (cat_rapidas,     'Wrap de pollo',               'Tortilla con pollo, lechuga, tomate y aderezo ranch',      24000, 12),
    (cat_rapidas,     'Taco de carne',               'Tortilla de maíz con carne molida, pico de gallo y guac',  20000, 10),

    # Snacks
    (cat_snacks,      'Papas fritas',                'Papas fritas crujientes con sal y pimienta',               12000,  8),
    (cat_snacks,      'Papas con queso y tocino',    'Papas fritas con queso cheddar derretido y trocitos de tocino', 18000, 10),
    (cat_snacks,      'Aros de cebolla',             'Aros de cebolla empanizados y fritos',                     15000, 10),
    (cat_snacks,      'Nachos con dips',             'Nachos crujientes con guacamole, pico de gallo y queso',   22000, 10),
    (cat_snacks,      'Deditos de queso',            'Palitos de queso empanizados con salsa de ajo',            16000, 10),
    (cat_snacks,      'Mini empanadas',              'Empanadas de pipián, carne o pollo — 6 unidades',          20000, 15),
    (cat_snacks,      'Yucas fritas',                'Yuca frita dorada con ají y guacamole',                    14000, 12),

    # Bebidas
    (cat_bebidas,     'Limonada de coco',            'Limonada natural con crema de coco',                       12000,  5),
    (cat_bebidas,     'Jugo natural',                'Fruta fresca del día — maracuyá, mango, mora o guanábana', 10000,  5),
    (cat_bebidas,     'Agua de panela',              'Tradicional bebida colombiana con limón',                   8000,  3),
    (cat_bebidas,     'Café americano',              'Café negro de origen colombiano',                           7000,  5),
    (cat_bebidas,     'Cappuccino',                  'Espresso con leche vaporizada y espuma',                   10000,  5),
    (cat_bebidas,     'Malteada de fresa',           'Malteada cremosa de fresa con helado',                     16000,  8),
    (cat_bebidas,     'Malteada de chocolate',       'Malteada de chocolate oscuro con helado de vainilla',      16000,  8),
    (cat_bebidas,     'Té frío de durazno',          'Té helado con sabor a durazno y menta fresca',             10000,  5),
    (cat_bebidas,     'Agua con gas',                'Agua mineral con gas',                                      6000,  2),
    (cat_bebidas,     'Gaseosa',                     'Coca-Cola, Sprite o Pepsi',                                 7000,  2),

    # Postres
    (cat_postres,     'Tres leches',                 'Esponjoso bizcocho bañado en tres leches con nata',        18000, 10),
    (cat_postres,     'Flan de coco',                'Flan cremoso con toque de coco y caramelo',                16000,  8),
    (cat_postres,     'Brownie con helado',          'Brownie de chocolate caliente con helado de vainilla',      20000, 10),
    (cat_postres,     'Cheesecake de frutos rojos',  'Cheesecake cremoso con coulis de frutos rojos',            22000, 10),
    (cat_postres,     'Helado artesanal',            'Dos bolas de helado artesanal — sabor a elección',         14000,  5),
    (cat_postres,     'Natilla con buñuelos',        'Natilla de canela con buñuelos esponjosos',                 15000,  8),
    (cat_postres,     'Waffles con fresas',          'Waffles esponjosos con fresas frescas y crema batida',     19000, 12),
]
for cat, nombre, desc, precio, tiempo in platos_data:
    Plato.objects.get_or_create(nombre=nombre, defaults={
        'categoria':      cat,
        'descripcion':    desc,
        'precio_base':    precio,
        'tiempo_prep_min': tiempo,
        'disponible':     True,
    })
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
