import os
import mimetypes
import logging
from urllib.parse import urljoin
from io import BytesIO

from django.conf import settings
from django.core.files.storage import Storage, FileSystemStorage
from django.core.files.base import ContentFile, File
import requests

logger = logging.getLogger(__name__)

class SupabaseMediaStorage(Storage):
    """
    Persistent cloud media storage routing uploads to Supabase Storage bucket.
    Falls back gracefully to local FileSystemStorage for local dev or network errors.
    """
    def __init__(self, **kwargs):
        self.project_ref = os.getenv('SUPABASE_PROJECT_REF', 'dayhifjcvcsnuclulbuj')
        self.supabase_url = os.getenv('SUPABASE_URL', f'https://{self.project_ref}.supabase.co').rstrip('/')
        self.supabase_key = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY', '')
        self.bucket = os.getenv('SUPABASE_MEDIA_BUCKET', 'media')
        self.local_storage = FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)

    def _get_supabase_headers(self, content_type=None):
        headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'x-upsert': 'true',
        }
        if content_type:
            headers['Content-Type'] = content_type
        return headers

    def _save(self, name, content):
        # 1. Always save a copy to local storage for local processing & caching
        saved_name = self.local_storage._save(name, content)

        # 2. Upload to Supabase Storage if credentials are configured
        if self.supabase_key:
            try:
                content.seek(0)
                file_bytes = content.read()
                content_type = mimetypes.guess_type(name)[0] or 'application/octet-stream'

                # Supabase Storage upload endpoint
                upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{saved_name}"
                headers = self._get_supabase_headers(content_type)

                res = requests.post(upload_url, data=file_bytes, headers=headers, timeout=30)
                if res.status_code in (200, 201):
                    logger.info("Successfully uploaded %s to Supabase Storage bucket '%s'", saved_name, self.bucket)
                else:
                    logger.warning(
                        "Supabase Storage upload returned status %d for %s: %s",
                        res.status_code, saved_name, res.text[:200]
                    )
            except Exception as e:
                logger.error("Error uploading %s to Supabase Storage: %s", saved_name, str(e))
            finally:
                try:
                    content.seek(0)
                except Exception:
                    pass

        return saved_name

    def _open(self, name, mode='rb'):
        # 1. Try opening locally first
        if self.local_storage.exists(name):
            return self.local_storage._open(name, mode)

        # 2. If not local, try fetching from Supabase Storage public URL
        public_url = self.url(name)
        try:
            res = requests.get(public_url, timeout=30)
            if res.status_code == 200:
                return ContentFile(res.content, name=name)
        except Exception as e:
            logger.error("Error fetching %s from Supabase Storage: %s", name, str(e))

        raise FileNotFoundError(f"File '{name}' could not be found locally or on Supabase Storage.")

    def delete(self, name):
        # 1. Delete locally
        if self.local_storage.exists(name):
            self.local_storage.delete(name)

        # 2. Delete from Supabase Storage
        if self.supabase_key:
            try:
                delete_url = f"{self.supabase_url}/storage/v1/object/{self.bucket}"
                headers = self._get_supabase_headers('application/json')
                payload = {'prefixes': [name]}
                requests.delete(delete_url, json=payload, headers=headers, timeout=15)
            except Exception as e:
                logger.error("Error deleting %s from Supabase Storage: %s", name, str(e))

    def exists(self, name):
        if self.local_storage.exists(name):
            return True
        if self.supabase_key:
            try:
                public_url = self.url(name)
                res = requests.head(public_url, timeout=5)
                return res.status_code == 200
            except Exception:
                return False
        return False

    def size(self, name):
        if self.local_storage.exists(name):
            return self.local_storage.size(name)
        try:
            public_url = self.url(name)
            res = requests.head(public_url, timeout=5)
            if res.status_code == 200 and 'Content-Length' in res.headers:
                return int(res.headers['Content-Length'])
        except Exception:
            pass
        return 0

    def url(self, name):
        # If cloud storage is preferred or SUPABASE_KEY is configured
        use_cloud = os.getenv('USE_SUPABASE_STORAGE', 'true').lower() in ('true', '1', 'yes')
        if use_cloud and (self.supabase_key or not settings.DEBUG):
            return f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{name}"
        
        # In local dev without Supabase key, fallback to local MEDIA_URL
        if self.local_storage.exists(name):
            return self.local_storage.url(name)
        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{name}"
