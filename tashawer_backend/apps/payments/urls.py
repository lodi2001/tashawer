from django.urls import path
from .views import (
    # Payment
    PaymentInitializeView,
    PaymentWebhookView,
    MockPaymentView,
    # Escrow
    EscrowListView,
    EscrowCreateView,
    EscrowDetailView,
    EscrowReleaseView,
    EscrowRefundView,
    # Transaction
    TransactionListView,
    TransactionDetailView,
    TransactionSummaryView,
    # Invoice
    InvoiceListView,
    InvoiceDetailView,
    InvoiceDownloadView,
)

app_name = 'payments'

urlpatterns = [
    # Payment gateway
    path('initialize/', PaymentInitializeView.as_view(), name='payment-initialize'),
    path('webhook/', PaymentWebhookView.as_view(), name='payment-webhook'),
    path('mock-payment/<str:reference_number>/', MockPaymentView.as_view(), name='mock-payment'),

    # Escrow
    path('escrow/', EscrowListView.as_view(), name='escrow-list'),
    path('escrow/create/', EscrowCreateView.as_view(), name='escrow-create'),
    path('escrow/<uuid:pk>/', EscrowDetailView.as_view(), name='escrow-detail'),
    path('escrow/<uuid:pk>/release/', EscrowReleaseView.as_view(), name='escrow-release'),
    path('escrow/<uuid:pk>/refund/', EscrowRefundView.as_view(), name='escrow-refund'),

    # Transactions
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('transactions/summary/', TransactionSummaryView.as_view(), name='transaction-summary'),
    path('transactions/<uuid:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),

    # Invoices
    path('invoices/', InvoiceListView.as_view(), name='invoice-list'),
    path('invoices/<uuid:pk>/', InvoiceDetailView.as_view(), name='invoice-detail'),
    path('invoices/<uuid:pk>/download/', InvoiceDownloadView.as_view(), name='invoice-download'),
]
