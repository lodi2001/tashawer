import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.http import FileResponse, HttpResponse

from apps.payments.models import Invoice, InvoiceStatus
from apps.payments.serializers import (
    InvoiceListSerializer,
    InvoiceDetailSerializer,
)

logger = logging.getLogger(__name__)


class InvoiceListView(APIView):
    """
    List invoices for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get list of user's invoices.

        Query parameters:
        - type: filter by invoice type (optional)
        - status: filter by status (optional)
        - page: page number (default: 1)
        - page_size: items per page (default: 20, max: 50)
        """
        type_filter = request.query_params.get('type')
        status_filter = request.query_params.get('status')

        invoices = Invoice.objects.filter(issued_to=request.user)

        # Apply filters
        if type_filter:
            invoices = invoices.filter(invoice_type=type_filter)
        if status_filter:
            invoices = invoices.filter(status=status_filter)

        invoices = invoices.order_by('-created_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 50)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = invoices.count()
        invoices = invoices[start:end]

        serializer = InvoiceListSerializer(invoices, many=True)

        return Response({
            'success': True,
            'data': {
                'invoices': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            }
        }, status=status.HTTP_200_OK)


class InvoiceDetailView(APIView):
    """
    Get invoice details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Get invoice details by ID."""
        invoice = get_object_or_404(
            Invoice.objects.filter(issued_to=request.user),
            pk=pk
        )

        serializer = InvoiceDetailSerializer(invoice)

        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class InvoiceDownloadView(APIView):
    """
    Download invoice as PDF.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Download invoice PDF."""
        invoice = get_object_or_404(
            Invoice.objects.filter(issued_to=request.user),
            pk=pk
        )

        # If PDF exists, return it
        if invoice.pdf_file:
            return FileResponse(
                invoice.pdf_file.open('rb'),
                as_attachment=True,
                filename=f"{invoice.invoice_number}.pdf"
            )

        # Generate PDF on-the-fly if not exists
        # In a real implementation, you would use a library like reportlab or weasyprint
        # For now, return a simple HTML representation

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice {invoice.invoice_number}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .header {{ text-align: center; margin-bottom: 40px; }}
                .details {{ margin-bottom: 30px; }}
                .table {{ width: 100%; border-collapse: collapse; }}
                .table th, .table td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
                .total {{ font-weight: bold; font-size: 1.2em; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>INVOICE</h1>
                <p>Tashawer Platform</p>
            </div>

            <div class="details">
                <p><strong>Invoice Number:</strong> {invoice.invoice_number}</p>
                <p><strong>Issue Date:</strong> {invoice.issue_date}</p>
                <p><strong>Due Date:</strong> {invoice.due_date or 'N/A'}</p>
                <p><strong>Issued To:</strong> {invoice.issued_to.get_full_name()}</p>
                <p><strong>Email:</strong> {invoice.issued_to.email}</p>
            </div>

            <table class="table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{invoice.description or 'Service'}</td>
                        <td>{invoice.subtotal} {invoice.currency}</td>
                    </tr>
                    <tr>
                        <td>VAT ({invoice.vat_rate}%)</td>
                        <td>{invoice.vat_amount} {invoice.currency}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="total">
                        <td>Total</td>
                        <td>{invoice.total} {invoice.currency}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="margin-top: 40px;">
                <p><strong>Status:</strong> {invoice.get_status_display()}</p>
            </div>
        </body>
        </html>
        """

        response = HttpResponse(html_content, content_type='text/html')
        response['Content-Disposition'] = f'attachment; filename="{invoice.invoice_number}.html"'

        return response
