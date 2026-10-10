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
    file_size = models.BigIntegerField(default=0, blank=True, null=True, help_text="Uploaded PDF file size in bytes")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.pdf_file:
            try:
                self.file_size = self.pdf_file.size
            except Exception:
                pass
        super().save(*args, **kwargs)

    @property
    def file_size_formatted(self):
        if not self.file_size:
            return None
        mb = self.file_size / (1024 * 1024)
        if mb < 0.1:
            kb = self.file_size / 1024
            return f"{kb:.1f} KB"
        return f"{mb:.1f} MB"

    def __str__(self):
        return f"{self.title} by {self.author} ({self.genre})"

