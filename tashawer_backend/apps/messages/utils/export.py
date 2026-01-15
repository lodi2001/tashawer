"""
Export utilities for conversations.
Supports PDF and CSV export formats.
"""

import csv
import io
from datetime import datetime
from django.http import HttpResponse

# Try to import reportlab for PDF generation
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def export_conversation_csv(conversation):
    """
    Export conversation to CSV format.

    Args:
        conversation: Conversation model instance

    Returns:
        HttpResponse with CSV content
    """
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        'Message ID',
        'Timestamp',
        'Sender Name',
        'Sender Email',
        'Sender Role',
        'Content',
        'Is Read',
        'Read At',
    ])

    # Messages
    messages = conversation.messages.all().order_by('created_at')
    for msg in messages:
        writer.writerow([
            str(msg.id),
            msg.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            msg.sender.get_full_name(),
            msg.sender.email,
            msg.sender.role,
            msg.content,
            'Yes' if msg.is_read else 'No',
            msg.read_at.strftime('%Y-%m-%d %H:%M:%S') if msg.read_at else '',
        ])

    output.seek(0)

    # Create response
    response = HttpResponse(output.getvalue(), content_type='text/csv')
    filename = f"conversation_{conversation.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    return response


def export_conversation_pdf(conversation):
    """
    Export conversation to PDF format.

    Args:
        conversation: Conversation model instance

    Returns:
        HttpResponse with PDF content
    """
    if not REPORTLAB_AVAILABLE:
        return export_conversation_csv(conversation)

    buffer = io.BytesIO()

    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
    )

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20,
    )
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=10,
    )
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=5,
    )
    message_style = ParagraphStyle(
        'MessageStyle',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=3,
        leftIndent=20,
    )
    sender_style = ParagraphStyle(
        'SenderStyle',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.grey,
        spaceAfter=2,
    )

    # Build content
    content = []

    # Title
    content.append(Paragraph('Conversation Export', title_style))
    content.append(Paragraph(f'Exported: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', normal_style))
    content.append(Spacer(1, 20))

    # Conversation Info
    content.append(Paragraph('Conversation Details', header_style))

    # Participants
    participants = conversation.participants.all()
    participant_names = ', '.join([f"{p.get_full_name()} ({p.role})" for p in participants])
    content.append(Paragraph(f'<b>Participants:</b> {participant_names}', normal_style))

    if conversation.subject:
        content.append(Paragraph(f'<b>Subject:</b> {conversation.subject}', normal_style))

    if conversation.project:
        content.append(Paragraph(f'<b>Project:</b> {conversation.project.title}', normal_style))

    if conversation.proposal:
        content.append(Paragraph(f'<b>Proposal ID:</b> {conversation.proposal.id}', normal_style))

    content.append(Paragraph(f'<b>Created:</b> {conversation.created_at.strftime("%Y-%m-%d %H:%M:%S")}', normal_style))
    content.append(Paragraph(f'<b>Last Activity:</b> {conversation.last_message_at.strftime("%Y-%m-%d %H:%M:%S") if conversation.last_message_at else "N/A"}', normal_style))

    content.append(Spacer(1, 20))

    # Messages
    content.append(Paragraph('Messages', header_style))

    messages = conversation.messages.all().order_by('created_at')
    message_count = messages.count()
    content.append(Paragraph(f'Total Messages: {message_count}', normal_style))
    content.append(Spacer(1, 10))

    for msg in messages:
        # Sender info
        sender_info = f'{msg.sender.get_full_name()} ({msg.sender.role}) - {msg.created_at.strftime("%Y-%m-%d %H:%M:%S")}'
        if msg.sender.role == 'admin':
            sender_info = f'<font color="red">{sender_info}</font>'

        content.append(Paragraph(sender_info, sender_style))

        # Message content (escape HTML)
        safe_content = msg.content.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        safe_content = safe_content.replace('\n', '<br/>')
        content.append(Paragraph(safe_content, message_style))

        # Read status
        read_status = f'Read: {msg.read_at.strftime("%Y-%m-%d %H:%M:%S") if msg.is_read and msg.read_at else "No"}'
        content.append(Paragraph(f'<font color="grey" size="8">{read_status}</font>', normal_style))

        content.append(Spacer(1, 10))

    # Build PDF
    doc.build(content)

    # Create response
    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    filename = f"conversation_{conversation.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    return response
