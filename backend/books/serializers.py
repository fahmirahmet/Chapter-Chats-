from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.ModelSerializer):
    pdf_url = serializers.SerializerMethodField()
    guide_url = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = (
            'id', 
            'title', 
            'author', 
            'total_pages', 
            'genre', 
            'synopsis', 
            'pdf_file', 
            'guide_file', 
            'pdf_url',
            'guide_url',
            'cover_image', 
            'cover_url',
            'created_at'
        )

    def get_pdf_url(self, obj):
        request = self.context.get('request')
        if obj.pdf_file and hasattr(obj.pdf_file, 'url'):
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            return obj.pdf_file.url
        if request:
            return request.build_absolute_uri(f'/api/books/{obj.id}/download/pdf/')
        return f'/api/books/{obj.id}/download/pdf/'

    def get_guide_url(self, obj):
        request = self.context.get('request')
        if obj.guide_file and hasattr(obj.guide_file, 'url'):
            if request:
                return request.build_absolute_uri(obj.guide_file.url)
            return obj.guide_file.url
        if request:
            return request.build_absolute_uri(f'/api/books/{obj.id}/download/guide/')
        return f'/api/books/{obj.id}/download/guide/'

    def get_cover_url(self, obj):
        request = self.context.get('request')
        if obj.cover_image and hasattr(obj.cover_image, 'url'):
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None

