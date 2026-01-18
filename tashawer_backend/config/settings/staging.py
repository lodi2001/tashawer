"""
Staging settings for Tashawer project.
Inherits from production but disables SSL-specific settings since staging
doesn't have SSL configured.
"""
from .production import *  # noqa

# Disable SSL redirect for staging (no SSL certificate)
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Disable HSTS for staging
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
