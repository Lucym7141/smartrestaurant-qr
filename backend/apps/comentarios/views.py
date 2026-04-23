from django.shortcuts import render

# Create your views here.
from rest_framework import generics, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import Comentario
from .serializers import ComentarioSerializer, CrearComentarioInputSerializer
from apps.catalogos.models import TipoComentario
from apps.mesas.models import SesionMesa
from utils.permisos import EsAdmin


class CrearComentarioView(views.APIView):
    """
    El cliente deja un comentario, queja, sugerencia
    o valoración al final de su visita.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CrearComentarioInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Validar tipo de comentario
        try:
            tipo = TipoComentario.objects.get(nombre=data['tipo'])
        except TipoComentario.DoesNotExist:
            return Response(
                {'error': f'Tipo "{data["tipo"]}" no válido. '
                          f'Usa: comentario, queja, sugerencia, valoracion'},
                status=400
            )

        # Sesión opcional — si viene, debe pertenecer al usuario
        sesion = None
        if data.get('sesion_id'):
            try:
                sesion = SesionMesa.objects.get(id=data['sesion_id'])
            except SesionMesa.DoesNotExist:
                return Response({'error': 'Sesión no encontrada'}, status=404)

        comentario = Comentario.objects.create(
            usuario    = request.user,
            sesion     = sesion,
            tipo       = tipo,
            valoracion = data.get('valoracion'),
            contenido  = data['contenido'],
        )

        return Response(
            ComentarioSerializer(comentario).data,
            status=status.HTTP_201_CREATED
        )


class MisComentariosView(generics.ListAPIView):
    """El cliente ve sus propios comentarios e historial de valoraciones."""
    permission_classes = [IsAuthenticated]
    serializer_class   = ComentarioSerializer

    def get_queryset(self):
        return Comentario.objects.filter(
            usuario=self.request.user
        ).order_by('-fecha')


class ComentariosPublicosView(generics.ListAPIView):
    """
    Vista pública de valoraciones y comentarios visibles.
    Se puede filtrar por tipo: ?tipo=valoracion
    """
    permission_classes = [AllowAny]
    serializer_class   = ComentarioSerializer

    def get_queryset(self):
        tipo = self.request.query_params.get('tipo')
        qs   = Comentario.objects.filter(
            visible=True
        ).order_by('-fecha')

        if tipo:
            qs = qs.filter(tipo__nombre=tipo)

        return qs


class ResumenValoracionesView(views.APIView):
    """
    Devuelve el promedio de valoraciones y distribución
    por estrellas para mostrar en la pantalla de inicio.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        valoraciones = Comentario.objects.filter(
            tipo__nombre='valoracion',
            visible=True,
            valoracion__isnull=False
        )

        total = valoraciones.count()
        if total == 0:
            return Response({
                'promedio':      0,
                'total_resenas': 0,
                'distribucion':  {str(i): 0 for i in range(1, 6)}
            })

        suma = sum(v.valoracion for v in valoraciones)
        promedio = round(suma / total, 1)

        distribucion = {str(i): 0 for i in range(1, 6)}
        for v in valoraciones:
            distribucion[str(v.valoracion)] += 1

        return Response({
            'promedio':      promedio,
            'total_resenas': total,
            'distribucion':  distribucion
        })


class GestionComentariosAdminView(generics.ListAPIView):
    """El admin ve todos los comentarios incluyendo los ocultos."""
    permission_classes = [IsAuthenticated, EsAdmin]
    serializer_class   = ComentarioSerializer

    def get_queryset(self):
        tipo = self.request.query_params.get('tipo')
        qs   = Comentario.objects.all().order_by('-fecha')
        if tipo:
            qs = qs.filter(tipo__nombre=tipo)
        return qs


class ToggleVisibilidadComentarioView(views.APIView):
    """El admin muestra u oculta un comentario."""
    permission_classes = [IsAuthenticated, EsAdmin]

    def patch(self, request, pk):
        try:
            comentario = Comentario.objects.get(pk=pk)
        except Comentario.DoesNotExist:
            return Response({'error': 'Comentario no encontrado'}, status=404)

        comentario.visible = not comentario.visible
        comentario.save()

        return Response({
            'mensaje': f'Comentario {"visible" if comentario.visible else "oculto"}',
            'visible': comentario.visible
        })