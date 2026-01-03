from django.urls import path
from .views import (
    # Payment
    PaymentInitializeView,
    PaymentWebhookView,
    PaymentStatusView,
    PaymentCallbackView,
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
    # Wallet & Deposit
    WalletView,
    WalletBalanceView,
    DepositListView,
    DepositDetailView,
    DepositInitializeView,
    DepositWebhookView,
    DepositStatusView,
    MockDepositView,
    # Bank Account & Withdrawal
    BankAccountListView,
    BankAccountCreateView,
    BankAccountDetailView,
    BankAccountSetPrimaryView,
    WithdrawalListView,
    WithdrawalDetailView,
    WithdrawalCreateView,
    WithdrawalCancelView,
    AdminWithdrawalListView,
    AdminWithdrawalDetailView,
    AdminWithdrawalApproveView,
    AdminWithdrawalRejectView,
    AdminWithdrawalProcessView,
    AdminWithdrawalCompleteView,
    AdminBankAccountVerifyView,
)

app_name = 'payments'

urlpatterns = [
    # Payment gateway
    path('initialize/', PaymentInitializeView.as_view(), name='payment-initialize'),
    path('webhook/', PaymentWebhookView.as_view(), name='payment-webhook'),
    path('callback/', PaymentCallbackView.as_view(), name='payment-callback'),
    path('status/<str:reference_number>/', PaymentStatusView.as_view(), name='payment-status'),
    path('mock-payment/<str:reference_number>/', MockPaymentView.as_view(), name='mock-payment'),

    # Wallet
    path('wallet/', WalletView.as_view(), name='wallet-detail'),
    path('wallet/balance/', WalletBalanceView.as_view(), name='wallet-balance'),

    # Deposits
    path('deposits/', DepositListView.as_view(), name='deposit-list'),
    path('deposits/initialize/', DepositInitializeView.as_view(), name='deposit-initialize'),
    path('deposits/webhook/', DepositWebhookView.as_view(), name='deposit-webhook'),
    path('deposits/<str:reference_number>/', DepositDetailView.as_view(), name='deposit-detail'),
    path('deposits/<str:reference_number>/status/', DepositStatusView.as_view(), name='deposit-status'),
    path('deposits/mock/<str:reference_number>/', MockDepositView.as_view(), name='mock-deposit'),

    # Bank Accounts
    path('bank-accounts/', BankAccountListView.as_view(), name='bank-account-list'),
    path('bank-accounts/create/', BankAccountCreateView.as_view(), name='bank-account-create'),
    path('bank-accounts/<uuid:pk>/', BankAccountDetailView.as_view(), name='bank-account-detail'),
    path('bank-accounts/<uuid:pk>/set-primary/', BankAccountSetPrimaryView.as_view(), name='bank-account-set-primary'),

    # Withdrawals
    path('withdrawals/', WithdrawalListView.as_view(), name='withdrawal-list'),
    path('withdrawals/create/', WithdrawalCreateView.as_view(), name='withdrawal-create'),
    path('withdrawals/<str:reference_number>/', WithdrawalDetailView.as_view(), name='withdrawal-detail'),
    path('withdrawals/<str:reference_number>/cancel/', WithdrawalCancelView.as_view(), name='withdrawal-cancel'),

    # Admin Withdrawals
    path('admin/withdrawals/', AdminWithdrawalListView.as_view(), name='admin-withdrawal-list'),
    path('admin/withdrawals/<str:reference_number>/', AdminWithdrawalDetailView.as_view(), name='admin-withdrawal-detail'),
    path('admin/withdrawals/<str:reference_number>/approve/', AdminWithdrawalApproveView.as_view(), name='admin-withdrawal-approve'),
    path('admin/withdrawals/<str:reference_number>/reject/', AdminWithdrawalRejectView.as_view(), name='admin-withdrawal-reject'),
    path('admin/withdrawals/<str:reference_number>/process/', AdminWithdrawalProcessView.as_view(), name='admin-withdrawal-process'),
    path('admin/withdrawals/<str:reference_number>/complete/', AdminWithdrawalCompleteView.as_view(), name='admin-withdrawal-complete'),
    path('admin/bank-accounts/<uuid:pk>/verify/', AdminBankAccountVerifyView.as_view(), name='admin-bank-account-verify'),

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
