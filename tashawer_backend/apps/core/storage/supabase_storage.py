"""
Supabase Storage Backend for Django.

This module provides a custom Django storage backend that stores files
in Supabase Storage.

Usage:
1. Create a Supabase project at https://supabase.com
2. Create a storage bucket named 'tashawer-files'
3. Set the environment variables:
   - SUPABASE_URL=https://your-project.supabase.co
   - SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   - SUPABASE_STORAGE_BUCKET=tashawer-files
"""
import mimetypes
import logging
from datetime import datetime
from typing import Optional, Tuple
from urllib.parse import urljoin

from django.conf import settings
from django.core.files.base import ContentFile, File
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

logger = logging.getLogger(__name__)


@deconstructible
class SupabaseStorage(Storage):
    """
    Custom Django storage backend for Supabase Storage.

    Files are organized in the following structure:
    Bucket (tashawer-files)
    ├── projects/
    │   └── {project_id}/
    │       └── attachments/
    └── orders/
        └── {order_id}/
            └── deliverables/
    """

    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
        bucket_name: Optional[str] = None,
    ):
        self._supabase_url = supabase_url or getattr(
            settings, 'SUPABASE_URL', ''
        )
        self._supabase_key = supabase_key or getattr(
            settings, 'SUPABASE_SERVICE_ROLE_KEY', ''
        )
        self._bucket_name = bucket_name or getattr(
            settings, 'SUPABASE_STORAGE_BUCKET', 'tashawer-files'
        )
        self._client = None

    @property
    def client(self):
        """Lazy load the Supabase client."""
        if self._client is None:
            self._client = self._get_client()
        return self._client

    @property
    def storage(self):
        """Get the storage client."""
        return self.client.storage

    @property
    def bucket(self):
        """Get the bucket client."""
        return self.storage.from_(self._bucket_name)

    def _get_client(self):
        """
        Create and return a Supabase client instance.
        """
        try:
            from supabase import create_client, Client

            if not self._supabase_url or not self._supabase_key:
                raise ValueError(
                    "Supabase URL and Service Role Key are required. "
                    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in settings."
                )

            return create_client(self._supabase_url, self._supabase_key)
        except ImportError:
            raise ImportError(
                "Supabase package is required. "
                "Install it with: pip install supabase"
            )

    def _normalize_path(self, name: str) -> str:
        """Normalize the file path."""
        # Remove leading slashes
        name = name.lstrip('/')
        # Replace backslashes with forward slashes
        name = name.replace('\\', '/')
        return name

    def _save(self, name: str, content: File) -> str:
        """
        Save the file to Supabase Storage.
        """
        name = self._normalize_path(name)

        # Determine MIME type
        mime_type = getattr(content, 'content_type', None)
        if not mime_type:
            mime_type, _ = mimetypes.guess_type(name)
        mime_type = mime_type or 'application/octet-stream'

        # Read content
        content.seek(0)
        file_content = content.read()

        # Upload to Supabase
        try:
            # Try to upload (will fail if exists)
            self.bucket.upload(
                path=name,
                file=file_content,
                file_options={"content-type": mime_type}
            )
        except Exception as e:
            error_msg = str(e)
            # If file exists, update it
            if 'Duplicate' in error_msg or 'already exists' in error_msg.lower():
                self.bucket.update(
                    path=name,
                    file=file_content,
                    file_options={"content-type": mime_type}
                )
            else:
                raise

        return name

    def _open(self, name: str, mode: str = 'rb') -> File:
        """
        Open a file from Supabase Storage.
        """
        name = self._normalize_path(name)

        response = self.bucket.download(name)
        return ContentFile(response, name=name)

    def delete(self, name: str) -> None:
        """
        Delete a file from Supabase Storage.
        """
        name = self._normalize_path(name)
        try:
            self.bucket.remove([name])
        except Exception as e:
            logger.warning(f"Failed to delete file {name}: {e}")

    def exists(self, name: str) -> bool:
        """
        Check if a file exists in Supabase Storage.
        """
        name = self._normalize_path(name)
        try:
            # Try to get file info by listing with exact path
            folder = '/'.join(name.split('/')[:-1]) or ''
            filename = name.split('/')[-1]

            result = self.bucket.list(folder)
            for item in result:
                if item.get('name') == filename:
                    return True
            return False
        except Exception:
            return False

    def url(self, name: str) -> str:
        """
        Get the public URL for the file.
        """
        name = self._normalize_path(name)
        result = self.bucket.get_public_url(name)
        return result

    def size(self, name: str) -> int:
        """
        Get the size of a file in Supabase Storage.
        """
        name = self._normalize_path(name)
        folder = '/'.join(name.split('/')[:-1]) or ''
        filename = name.split('/')[-1]

        result = self.bucket.list(folder)
        for item in result:
            if item.get('name') == filename:
                metadata = item.get('metadata', {})
                return metadata.get('size', 0)
        return 0

    def listdir(self, path: str) -> Tuple[list, list]:
        """
        List the contents of a directory.
        Returns (directories, files).
        """
        path = self._normalize_path(path)

        result = self.bucket.list(path)

        directories = []
        files = []

        for item in result:
            name = item.get('name', '')
            # Items with id are files, items without are folders
            if item.get('id'):
                files.append(name)
            else:
                directories.append(name)

        return directories, files

    def get_accessed_time(self, name: str) -> datetime:
        """Not supported by Supabase Storage."""
        raise NotImplementedError(
            "Supabase Storage does not track accessed time"
        )

    def get_created_time(self, name: str) -> datetime:
        """Get the creation time of a file."""
        name = self._normalize_path(name)
        folder = '/'.join(name.split('/')[:-1]) or ''
        filename = name.split('/')[-1]

        result = self.bucket.list(folder)
        for item in result:
            if item.get('name') == filename:
                created_at = item.get('created_at')
                if created_at:
                    return datetime.fromisoformat(
                        created_at.replace('Z', '+00:00')
                    )
        raise FileNotFoundError(f"File not found: {name}")

    def get_modified_time(self, name: str) -> datetime:
        """Get the modification time of a file."""
        name = self._normalize_path(name)
        folder = '/'.join(name.split('/')[:-1]) or ''
        filename = name.split('/')[-1]

        result = self.bucket.list(folder)
        for item in result:
            if item.get('name') == filename:
                updated_at = item.get('updated_at')
                if updated_at:
                    return datetime.fromisoformat(
                        updated_at.replace('Z', '+00:00')
                    )
        raise FileNotFoundError(f"File not found: {name}")
