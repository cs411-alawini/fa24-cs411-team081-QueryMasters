from rest_framework import viewsets, filters
from .models import Product
from .serializers import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'brand']
    ordering_fields = ['price', 'rating']

    def get_queryset(self):
        queryset = super().get_queryset()
        price_range = self.request.query_params.get('priceRange')
        brand = self.request.query_params.get('brand')
        product_type = self.request.query_params.get('productType')

        if price_range:
            if price_range == 'low':
                queryset = queryset.filter(price__lt=20)
            elif price_range == 'medium':
                queryset = queryset.filter(price__gte=20, price__lt=50)
            elif price_range == 'high':
                queryset = queryset.filter(price__gte=50)
        
        if brand:
            queryset = queryset.filter(brand__icontains=brand)

        if product_type:
            queryset = queryset.filter(category__icontains=product_type)
        
        return queryset
