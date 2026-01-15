"""
PDF generation service for proposals.
"""

import io
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from django.http import HttpResponse

logger = logging.getLogger(__name__)

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        PageBreak, Image
    )
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logger.warning("ReportLab not installed. PDF generation will not work.")


class PDFGeneratorService:
    """
    Service for generating professional PDF documents.
    """

    # Tashawer brand colors
    PRIMARY_COLOR = colors.HexColor('#10B981')  # Green
    SECONDARY_COLOR = colors.HexColor('#1F2937')  # Dark gray
    ACCENT_COLOR = colors.HexColor('#059669')  # Darker green
    TEXT_COLOR = colors.HexColor('#374151')
    LIGHT_GRAY = colors.HexColor('#F3F4F6')

    def __init__(self):
        self.available = REPORTLAB_AVAILABLE

    def is_available(self) -> bool:
        return self.available

    def _get_styles(self, is_rtl: bool = True):
        """Get configured paragraph styles."""
        styles = getSampleStyleSheet()

        alignment = TA_RIGHT if is_rtl else TA_LEFT

        # Custom styles
        title_style = ParagraphStyle(
            'ProposalTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=self.SECONDARY_COLOR,
            spaceAfter=20,
            alignment=TA_CENTER,
        )

        heading_style = ParagraphStyle(
            'ProposalHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=self.PRIMARY_COLOR,
            spaceAfter=12,
            spaceBefore=20,
            alignment=alignment,
        )

        subheading_style = ParagraphStyle(
            'ProposalSubheading',
            parent=styles['Heading3'],
            fontSize=14,
            textColor=self.SECONDARY_COLOR,
            spaceAfter=8,
            alignment=alignment,
        )

        body_style = ParagraphStyle(
            'ProposalBody',
            parent=styles['Normal'],
            fontSize=11,
            textColor=self.TEXT_COLOR,
            spaceAfter=8,
            alignment=alignment,
            leading=16,
        )

        footer_style = ParagraphStyle(
            'ProposalFooter',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.grey,
            alignment=TA_CENTER,
        )

        return {
            'title': title_style,
            'heading': heading_style,
            'subheading': subheading_style,
            'body': body_style,
            'footer': footer_style,
        }

    def generate_proposal_pdf(
        self,
        proposal_content: str,
        project_title: str,
        consultant_name: str,
        proposed_amount: Optional[str] = None,
        currency: str = 'SAR',
        is_rtl: bool = True,
    ) -> HttpResponse:
        """
        Generate a PDF document for a proposal.

        Args:
            proposal_content: The proposal text (Markdown format)
            project_title: Project title
            consultant_name: Consultant name
            proposed_amount: Proposed price
            currency: Currency code
            is_rtl: Whether to use RTL layout (for Arabic)

        Returns:
            HttpResponse with PDF content
        """
        if not self.available:
            return HttpResponse(
                "PDF generation is not available. Please install reportlab.",
                content_type='text/plain',
                status=500
            )

        buffer = io.BytesIO()
        styles = self._get_styles(is_rtl)

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm,
        )

        content = []

        # Header
        content.append(Paragraph("تشاور | Tashawer", styles['title']))
        content.append(Spacer(1, 10))
        content.append(Paragraph("عرض استشاري / Consulting Proposal", styles['heading']))
        content.append(Spacer(1, 20))

        # Meta info table
        meta_data = [
            ['المشروع / Project:', project_title],
            ['المستشار / Consultant:', consultant_name],
            ['التاريخ / Date:', datetime.now().strftime('%Y-%m-%d')],
        ]
        if proposed_amount:
            meta_data.append(['السعر / Price:', f"{proposed_amount} {currency}"])

        meta_table = Table(meta_data, colWidths=[4*cm, 12*cm])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), self.LIGHT_GRAY),
            ('TEXTCOLOR', (0, 0), (0, -1), self.SECONDARY_COLOR),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT' if is_rtl else 'LEFT'),
        ]))
        content.append(meta_table)
        content.append(Spacer(1, 30))

        # Parse proposal content (simple Markdown parsing)
        lines = proposal_content.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                content.append(Spacer(1, 8))
                continue

            # Headers
            if line.startswith('## '):
                text = line[3:].strip()
                content.append(Paragraph(self._escape_html(text), styles['heading']))
            elif line.startswith('### '):
                text = line[4:].strip()
                content.append(Paragraph(self._escape_html(text), styles['subheading']))
            elif line.startswith('# '):
                text = line[2:].strip()
                content.append(Paragraph(self._escape_html(text), styles['title']))
            elif line.startswith('- '):
                text = line[2:].strip()
                bullet = '•' if not is_rtl else '•'
                content.append(Paragraph(f"{bullet} {self._escape_html(text)}", styles['body']))
            elif line.startswith('* '):
                text = line[2:].strip()
                bullet = '•'
                content.append(Paragraph(f"{bullet} {self._escape_html(text)}", styles['body']))
            else:
                # Regular paragraph
                content.append(Paragraph(self._escape_html(line), styles['body']))

        # Footer
        content.append(Spacer(1, 40))
        content.append(Paragraph(
            "تم إنشاء هذا العرض بواسطة منصة تشاور | Generated via Tashawer Platform",
            styles['footer']
        ))
        content.append(Paragraph(
            f"© {datetime.now().year} Tashawer - جميع الحقوق محفوظة",
            styles['footer']
        ))

        # Build PDF
        doc.build(content)

        # Create response
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        filename = f"proposal_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        return response

    def _escape_html(self, text: str) -> str:
        """Escape HTML special characters for ReportLab."""
        return (
            text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('**', '')  # Remove markdown bold
            .replace('__', '')  # Remove markdown underline
        )

    def generate_proposal_pdf_from_instance(
        self,
        proposal_instance,
        proposal_content: str,
    ) -> HttpResponse:
        """
        Generate PDF from a Proposal model instance.

        Args:
            proposal_instance: Proposal model instance
            proposal_content: Generated proposal text

        Returns:
            HttpResponse with PDF
        """
        return self.generate_proposal_pdf(
            proposal_content=proposal_content,
            project_title=proposal_instance.project.title if proposal_instance.project else 'Untitled',
            consultant_name=proposal_instance.consultant.get_full_name() if proposal_instance.consultant else 'Unknown',
            proposed_amount=str(proposal_instance.proposed_amount) if proposal_instance.proposed_amount else None,
            currency='SAR',
            is_rtl=True,
        )
