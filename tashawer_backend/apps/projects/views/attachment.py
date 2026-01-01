import logging
import mimetypes
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from apps.core.permissions import IsClient
from apps.projects.models import Project, ProjectAttachment, ProjectStatus
from apps.projects.serializers import ProjectAttachmentSerializer

logger = logging.getLogger(__name__)

# Allowed file types
ALLOWED_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'txt', 'csv', 'zip', 'rar', '7z',
    'jpg', 'jpeg', 'png', 'gif', 'bmp',
    'dwg', 'dxf',  # CAD files
]

ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'application/acad',
    'application/x-autocad',
    'image/vnd.dxf',
]

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class ProjectAttachmentUploadView(APIView):
    """
    Upload attachments to a project.
    Only the project owner can upload attachments.
    """
    permission_classes = [IsAuthenticated, IsClient]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        """
        Upload one or more files to a project.

        Request body (multipart/form-data):
        - files: one or more files to upload
        """
        project = get_object_or_404(Project, pk=pk, client=request.user)

        # Check if project is editable
        if not project.is_editable:
            return Response({
                'success': False,
                'message': 'Cannot add attachments to this project in its current status'
            }, status=status.HTTP_400_BAD_REQUEST)

        files = request.FILES.getlist('files')
        if not files:
            return Response({
                'success': False,
                'message': 'No files provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        uploaded_attachments = []
        errors = []

        for file in files:
            # Validate file extension
            file_ext = file.name.split('.')[-1].lower() if '.' in file.name else ''
            if file_ext not in ALLOWED_EXTENSIONS:
                errors.append({
                    'filename': file.name,
                    'error': f'File type .{file_ext} is not allowed'
                })
                continue

            # Validate file size
            if file.size > MAX_FILE_SIZE:
                errors.append({
                    'filename': file.name,
                    'error': f'File exceeds maximum size of {MAX_FILE_SIZE // (1024 * 1024)} MB'
                })
                continue

            # Get MIME type
            mime_type, _ = mimetypes.guess_type(file.name)
            if not mime_type:
                mime_type = file.content_type or 'application/octet-stream'

            # Create attachment
            attachment = ProjectAttachment.objects.create(
                project=project,
                file=file,
                original_filename=file.name,
                file_size=file.size,
                file_type=mime_type,
                uploaded_by=request.user
            )

            uploaded_attachments.append(attachment)
            logger.info(f"Attachment uploaded: {attachment.id} to project {project.id}")

        if not uploaded_attachments and errors:
            return Response({
                'success': False,
                'message': 'No files were uploaded',
                'errors': errors
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProjectAttachmentSerializer(uploaded_attachments, many=True)

        response_data = {
            'success': True,
            'message': f'{len(uploaded_attachments)} file(s) uploaded successfully',
            'data': {
                'attachments': serializer.data
            }
        }

        if errors:
            response_data['errors'] = errors

        return Response(response_data, status=status.HTTP_201_CREATED)


class ProjectAttachmentDeleteView(APIView):
    """
    Delete an attachment from a project.
    Only the project owner can delete attachments.
    """
    permission_classes = [IsAuthenticated, IsClient]

    def delete(self, request, pk, attachment_id):
        """Delete an attachment."""
        project = get_object_or_404(Project, pk=pk, client=request.user)

        # Check if project is editable
        if not project.is_editable:
            return Response({
                'success': False,
                'message': 'Cannot delete attachments from this project in its current status'
            }, status=status.HTTP_400_BAD_REQUEST)

        attachment = get_object_or_404(
            ProjectAttachment,
            id=attachment_id,
            project=project
        )

        attachment_id_str = str(attachment.id)
        filename = attachment.original_filename

        # Delete the file from storage
        if attachment.file:
            attachment.file.delete(save=False)

        # Soft delete the attachment record
        attachment.delete()

        logger.info(f"Attachment deleted: {attachment_id_str} from project {project.id}")

        return Response({
            'success': True,
            'message': f'Attachment "{filename}" deleted successfully'
        }, status=status.HTTP_200_OK)


class ProjectAttachmentListView(APIView):
    """
    List all attachments for a project.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Get list of attachments for a project."""
        project = get_object_or_404(Project, pk=pk)

        # Check access
        is_owner = project.client_id == request.user.id
        is_admin = request.user.role == 'admin'

        if not is_owner and not is_admin and project.status != ProjectStatus.OPEN:
            return Response({
                'success': False,
                'message': 'Project not found'
            }, status=status.HTTP_404_NOT_FOUND)

        attachments = project.attachments.all()
        serializer = ProjectAttachmentSerializer(attachments, many=True)

        return Response({
            'success': True,
            'data': {
                'attachments': serializer.data,
                'count': attachments.count()
            }
        }, status=status.HTTP_200_OK)
