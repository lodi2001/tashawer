from django.urls import path
from .views import (
    # Order views
    OrderListView,
    OrderDetailView,
    OrderCreateView,
    OrderStartWorkView,
    OrderDeliverView,
    OrderRevisionView,
    OrderCompleteView,
    OrderCancelView,
    OrderExtendDeadlineView,
    # Milestone views
    MilestoneListView,
    MilestoneCreateView,
    MilestoneDetailView,
    MilestoneStartView,
    MilestoneSubmitView,
    MilestoneApproveView,
    MilestoneRevisionView,
    # Deliverable views
    DeliverableUploadView,
    DeliverableListView,
    DeliverableDeleteView,
)

app_name = 'orders'

urlpatterns = [
    # Orders
    path('', OrderListView.as_view(), name='order-list'),
    path('create/', OrderCreateView.as_view(), name='order-create'),
    path('<str:order_number>/', OrderDetailView.as_view(), name='order-detail'),
    path('<str:order_number>/start/', OrderStartWorkView.as_view(), name='order-start'),
    path('<str:order_number>/deliver/', OrderDeliverView.as_view(), name='order-deliver'),
    path('<str:order_number>/revision/', OrderRevisionView.as_view(), name='order-revision'),
    path('<str:order_number>/complete/', OrderCompleteView.as_view(), name='order-complete'),
    path('<str:order_number>/cancel/', OrderCancelView.as_view(), name='order-cancel'),
    path('<str:order_number>/extend-deadline/', OrderExtendDeadlineView.as_view(), name='order-extend-deadline'),

    # Milestones
    path('<str:order_number>/milestones/', MilestoneListView.as_view(), name='milestone-list'),
    path('<str:order_number>/milestones/create/', MilestoneCreateView.as_view(), name='milestone-create'),
    path('milestones/<uuid:milestone_id>/', MilestoneDetailView.as_view(), name='milestone-detail'),
    path('milestones/<uuid:milestone_id>/start/', MilestoneStartView.as_view(), name='milestone-start'),
    path('milestones/<uuid:milestone_id>/submit/', MilestoneSubmitView.as_view(), name='milestone-submit'),
    path('milestones/<uuid:milestone_id>/approve/', MilestoneApproveView.as_view(), name='milestone-approve'),
    path('milestones/<uuid:milestone_id>/revision/', MilestoneRevisionView.as_view(), name='milestone-revision'),

    # Deliverables
    path('milestones/<uuid:milestone_id>/deliverables/', DeliverableListView.as_view(), name='deliverable-list'),
    path('milestones/<uuid:milestone_id>/deliverables/upload/', DeliverableUploadView.as_view(), name='deliverable-upload'),
    path('deliverables/<uuid:deliverable_id>/', DeliverableDeleteView.as_view(), name='deliverable-delete'),
]
