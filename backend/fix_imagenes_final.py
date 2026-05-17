"""
fix_imagenes_final.py — Actualiza las imágenes de todos los platos con las URLs elegidas.
Ejecutar con: python fix_imagenes_final.py
Desde la carpeta backend/ con el entorno virtual activado.
"""
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.menu.models import Plato

IMAGENES = {
    # ── Entradas ──────────────────────────────────────────────────────────────
    'Bruschetta mixta':
        'https://us.123rf.com/450wm/white78/white782304/white78230400448/201643685-aperitivo-tradicional-italiano-antipasto-bruschetta-con-carne-pescado-verduras-y-vinagre-bals%C3%A1mico.jpg?ver=6',
    'Croquetas de jamón':
        'https://okelan.es/wp-content/uploads/2023/03/croqueta-de-jamon.jpg',
    'Ceviche de camarón':
        'https://www.adrianasbestrecipes.com/wp-content/uploads/2011/06/Shrimp-Ceviche1.jpg.webp',
    'Tabla de quesos':
        'https://aradominimarket.es/wp-content/uploads/2024/10/Tabla-mediana-de-quesos.png',
    'Alitas BBQ':
        'https://www.labuena.com.co/wp-content/uploads/2020/10/alitas-BBQ-imagen-destacada.jpg',
    'Patacones con hogao':
        'https://ruta75.com/wp-content/uploads/2023/04/Photo-Jul-12-4-33-25-PM-1-scaled.jpg',

    # ── Platos fuertes ────────────────────────────────────────────────────────
    'Bandeja paisa':
        'https://recetasdecocina.elmundo.es/wp-content/uploads/2025/05/bandeja-paisa.jpg',
    'Pollo a la plancha':
        'https://tofuu.getjusto.com/orioneat-local/resized2/cKtbYgWAdB4pb4rDy-2400-x.webp',
    'Cazuela de mariscos':
        'https://especiasmontero.com/wp-content/uploads/2025/03/Cazuela-de-mariscos.jpg',
    'Lomo al trapo':
        'https://grupotoma.com/wp-content/uploads/lomo-trapo-directo-a-las-brasas-1900Wx500H.jpg',
    'Trucha a la mantequilla':
        'https://recipe1.ezmember.co.kr/cache/recipe/2015/11/11/4aab14dba7148b1c201805d39947b3d91.jpg',
    'Costillas de cerdo':
        'https://www.demoslavueltaaldia.com/sites/default/files/costillitas-cerdo-doradas-papillote.jpg',
    'Arroz con pollo':
        'https://imag.bonviveur.com/arroz-con-pollo.jpg',
    'Lomo al ajillo':
        'https://yhoyquecomemos.com/wp-content/uploads/2016/10/filetes-de-lomo-al-ajillo-receta-2.jpg',
    'Camarones al limón':
        'https://thumbs.dreamstime.com/b/peque%C3%B1o-camar%C3%B3n-con-el-lim%C3%B3n-en-un-sart%C3%A9n-85157485.jpg',

    # ── Pastas ────────────────────────────────────────────────────────────────
    'Spaghetti carbonara':
        'https://images.services.kitchenstories.io/6glN_4JhpVS9aUiBS7JnGsuDULA=/3840x0/filters:quality(80)/images.kitchenstories.io/wagtailOriginalImages/R2568-photo-final-_0.jpg',
    'Penne arrabiata':
        'https://www.andy-cooks.com/cdn/shop/articles/20250710035519-andy-20cooks-20-20quick-20arrabbiata-20pasta-20recipe_daf853ef-dee8-4da0-8701-b8dda36397bf.jpg?v=1773806187',
    'Lasaña de carne':
        'https://newmansown.com/wp-content/uploads/2022/03/Homemade-lasagna-1200x900.png',
    'Fettuccine alfredo':
        'https://i0.wp.com/www.buenossaborespanama.com/wp-content/uploads/2026/02/image-8.jpeg?fit=1146%2C645&ssl=1',
    'Pasta al pesto':
        'https://imag.bonviveur.com/espaguetis-al-pesto.jpg',
    'Rigatoni con salchicha':
        'https://www.pastasroma.com/wp-content/uploads/2018/12/Pasta-con-salchichas-y-tomate.webp',

    # ── Sopas y caldos ────────────────────────────────────────────────────────
    'Sancocho de gallina':
        'https://ecommerce.surtifamiliar.com/backend/admin/backend/web/archivosDelCliente/blogs/images/20210116085848-Sancocho.jpg',
    'Sopa de lentejas':
        'https://www.goya.com/wp-content/uploads/2023/10/hearty-lentil-soup.jpg',
    'Crema de champiñones':
        'https://cdn.colombia.com/gastronomia/2011/07/27/crema-de-champinones-1546.jpg',
    'Caldo de costilla':
        'https://i.ytimg.com/vi/k7CkaQzuqHE/maxresdefault.jpg',
    'Sopa minestrone':
        'https://veggiefestchicago.org/wp-content/uploads/2018/10/minestrone-soup-recipe.jpg',
    'Crema de ahuyama':
        'https://www.recetasnestle.com.co/sites/default/files/srh_recipes/10cc8bdadc1357daa59c8d2ecb018708.jpg',

    # ── Comidas rápidas ───────────────────────────────────────────────────────
    'Hamburguesa clásica':
        'https://imag.bonviveur.com/hamburguesa-clasica.jpg',
    'Hamburguesa BBQ':
        'https://www.recetasnestlecam.com/sites/default/files/srh_recipes/74e1a2dfe688f08eedf86a3711c8e4fb.png',
    'Hot dog especial':
        'https://www.recetasnestle.com.mx/sites/default/files/srh_recipes/05b0c91b17ded782d5cb45158897244f.jpg',
    'Perro con todo':
        'https://imag.bonviveur.com/perrito-caliente.jpg',
    'Pizza personal margherita':
        'https://cdn.loveandlemons.com/wp-content/uploads/opengraph/2023/07/margherita-pizza-recipe.jpg',
    'Pizza personal pepperoni':
        'https://papajohns.vtexassets.com/arquivos/ids/158044/FUNDIDA-CON-PEPPERONI.jpg.jpg?v=639008598884170000',
    'Wrap de pollo':
        'https://resuelveconbimbo-com-v2-assets.s3.amazonaws.com/s3fs-public/2024-01/Banner%20Desktop_Wrap%20de%20Pollo.webp?VersionId=Gi5bWLFSfFnCTn80o5DrZEklPfhs8l3q',
    'Taco de carne':
        'https://whisperofyum.com/wp-content/uploads/2024/05/whisper-of-yum-Carne-asada-tacos.jpg',

    # ── Snacks ────────────────────────────────────────────────────────────────
    'Papas fritas':
        'https://www.recetasnestle.com.co/sites/default/files/inline-images/hacer-papas-fritas-con-salsa-bbq.jpg',
    'Papas con queso y tocino':
        'https://tomaleche.com/wp-content/uploads/sites/2/2021/06/GettyImages-921916164-scaled.jpg',
    'Aros de cebolla':
        'https://cdn.blog.paulinacocina.net/wp-content/uploads/2021/12/aros-de-cebolla-fritos.jpg',
    'Nachos con dips':
        'https://images.aws.nestle.recipes/resized/2020_06_23T11_58_14_mrs_ImageRecipes_27924lrg_1200_628.jpg',
    'Deditos de queso':
        'https://loyalty-imagenes.canalrcn.com/loyalty/images/strapi/receta_deditos_de_queso_d44e461966.webp',
    'Mini empanadas':
        'https://amazonicaofficial.com/cdn/shop/files/Fotosambientadas-2_650825c2-d759-4db7-b97e-dba043ca3c57.png?v=1716500463&width=720',
    'Yucas fritas':
        'https://www.laylita.com/recetas/wp-content/uploads/2021/12/Yucas-fritas-1024x683.jpg',

    # ── Bebidas ───────────────────────────────────────────────────────────────
    'Limonada de coco':
        'https://k-listo.com/wp-content/uploads/2020/10/LIMONADA_COCO.jpg',
    'Jugo natural':
        'https://k-listo.com/wp-content/uploads/2021/11/JUGOS.jpg',
    'Agua de panela':
        'https://vecinavegetariana.com/wp-content/uploads/2022/04/Limonada-de-Panela-Colombian-Sugarcane-Limeade-4-1.jpeg',
    'Café americano':
        'https://www.somoselcafe.com.ar/img/novedades/47.jpg',
    'Cappuccino':
        'https://images.ctfassets.net/0e6jqcgsrcye/4ralYlLl5gF86u1yc3d1y4/38b202b70a945d694198347e4af66953/How-to-make-a-perfect-cappuccino-at-home-flavoured-cappuccino.jpg',
    'Malteada de fresa':
        'https://www.recetasnestle.com.co/sites/default/files/srh_recipes/23829ccf3c8af248298c5f91d95aa3ba.jpg',
    'Malteada de chocolate':
        'https://i.blogs.es/ba1ea2/como-hacer-malteada-de-fresa-1-/450_1000.jpg',
    'Té frío de durazno':
        'https://www.gastrolabweb.com/u/fotografias/fotosnoticias/2023/6/22/48606.jpg',
    'Agua con gas':
        'https://mejorconsalud.as.com/wp-content/uploads/2020/05/agua-gas-salud.jpg',
    'Gaseosa':
        'https://cdn.inoutdelivery.com/cinecolombia.inoutdelivery.com/sm/1588184270759-gaseosas-300.jpg',

    # ── Postres ───────────────────────────────────────────────────────────────
    'Tres leches':
        'https://cdn0.recetasgratis.net/es/posts/0/1/9/torta_tres_leches_8910_600.jpg',
    'Flan de coco':
        'https://www.recetasnestle.com.do/sites/default/files/styles/recipe_detail_desktop_new/public/srh_recipes/f4d0c7d20ba3edf480b0e92261be0320.jpg?itok=oCk0AlVG',
    'Brownie con helado':
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwS4wC7nP10Tj7n4G-d27nQvTTrwujN9dmCQ&s',
    'Cheesecake de frutos rojos':
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQo131U8yaxavwAtfC9jtkwtg8tIsq5SEt-hw&s',
    'Helado artesanal':
        'https://i.blogs.es/098b7c/helados1/840_560.jpg',
    'Natilla con buñuelos':
        'https://st5.depositphotos.com/6922808/62485/i/1600/depositphotos_624854432-stock-photo-natilla-bunuelos-colombian-gastronomic-combination.jpg',
    'Waffles con fresas':
        'https://cdn.avena.io/avena-recipes-v2/2024/10/1730402516586.png',
    'Tiramisú':
        'https://www.coolhullfarm.com/wp-content/uploads/2018/12/2132-Italian-Tiramisu-Assiette-60-scaled.jpg',
}

print('\n🖼️  Actualizando imágenes de platos...\n')
actualizados = 0
no_encontrados = []

for nombre, url in IMAGENES.items():
    try:
        plato = Plato.objects.get(nombre=nombre)
        plato.imagen_url = url
        plato.save(update_fields=['imagen_url'])
        actualizados += 1
        print(f'  ✅ {nombre}')
    except Plato.DoesNotExist:
        no_encontrados.append(nombre)
        print(f'  ❌ No encontrado: {nombre}')

print(f'\n🎉 {actualizados} platos actualizados.')
if no_encontrados:
    print(f'❌ No encontrados ({len(no_encontrados)}):')
    for n in no_encontrados:
        print(f'   - {n}')
