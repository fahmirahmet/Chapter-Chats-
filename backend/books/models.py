from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    total_pages = models.IntegerField()
    genre = models.CharField(max_length=100)
    synopsis = models.TextField()
    pdf_file = models.FileField(upload_to='books_pdf/', blank=True, null=True, help_text="PDF reading binary stream")
    guide_file = models.FileField(upload_to='book_guides/', blank=True, null=True, help_text="Official discussion guide worksheet")
    cover_image = models.ImageField(upload_to='books/covers/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.author} ({self.genre})"

