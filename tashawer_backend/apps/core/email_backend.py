"""
Custom TurboSMTP Email Backend using HTTP API.
"""
import http.client
import json
import logging

from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings

logger = logging.getLogger(__name__)


class TurboSMTPEmailBackend(BaseEmailBackend):
    """
    Email backend that sends emails using TurboSMTP HTTP API.
    """

    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.consumer_key = getattr(settings, 'TURBOSMTP_CONSUMER_KEY', '')
        self.consumer_secret = getattr(settings, 'TURBOSMTP_CONSUMER_SECRET', '')
        self.api_url = 'api.turbo-smtp.com'
        self.api_endpoint = '/api/v2/mail/send'

    def send_messages(self, email_messages):
        """
        Send one or more EmailMessage objects and return the number of email
        messages sent.
        """
        if not email_messages:
            return 0

        num_sent = 0
        for message in email_messages:
            try:
                sent = self._send(message)
                if sent:
                    num_sent += 1
            except Exception as e:
                logger.error(f'Failed to send email: {e}')
                if not self.fail_silently:
                    raise

        return num_sent

    def _send(self, message):
        """
        Send a single EmailMessage using TurboSMTP API.
        """
        # Prepare recipients
        to_emails = ','.join(message.to) if message.to else ''
        cc_emails = ','.join(message.cc) if message.cc else ''
        bcc_emails = ','.join(message.bcc) if message.bcc else ''

        # Prepare email data
        data = {
            'from': message.from_email or settings.DEFAULT_FROM_EMAIL,
            'to': to_emails,
            'subject': message.subject,
            'content': message.body,
        }

        # Add CC and BCC if present
        if cc_emails:
            data['cc'] = cc_emails
        if bcc_emails:
            data['bcc'] = bcc_emails

        # Check for HTML content
        if hasattr(message, 'alternatives') and message.alternatives:
            for content, mimetype in message.alternatives:
                if mimetype == 'text/html':
                    data['html_content'] = content
                    break

        # Setup headers
        headers = {
            'Accept': 'application/json',
            'Consumerkey': self.consumer_key,
            'Consumersecret': self.consumer_secret,
            'Content-Type': 'application/json',
        }

        # Convert to JSON
        data_json = json.dumps(data)

        # Create HTTP connection and send
        conn = http.client.HTTPSConnection(self.api_url)

        try:
            conn.request('POST', self.api_endpoint, body=data_json, headers=headers)
            response = conn.getresponse()
            response_data = response.read().decode('utf-8')

            logger.info(f'TurboSMTP API Response: {response.status} - {response_data}')

            if response.status in [200, 201]:
                return True
            else:
                logger.error(f'TurboSMTP API Error: {response.status} - {response_data}')
                if not self.fail_silently:
                    raise Exception(f'TurboSMTP API Error: {response_data}')
                return False
        finally:
            conn.close()
