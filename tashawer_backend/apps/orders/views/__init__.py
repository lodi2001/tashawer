from .order import (
    OrderListView,
    OrderDetailView,
    OrderCreateView,
    OrderStartWorkView,
    OrderDeliverView,
    OrderRevisionView,
    OrderCompleteView,
    OrderCancelView,
    OrderExtendDeadlineView,
)
from .milestone import (
    MilestoneListView,
    MilestoneCreateView,
    MilestoneDetailView,
    MilestoneStartView,
    MilestoneSubmitView,
    MilestoneApproveView,
    MilestoneRevisionView,
    DeliverableUploadView,
    DeliverableListView,
    DeliverableDeleteView,
)

__all__ = [
    # Order views
    'OrderListView',
    'OrderDetailView',
    'OrderCreateView',
    'OrderStartWorkView',
    'OrderDeliverView',
    'OrderRevisionView',
    'OrderCompleteView',
    'OrderCancelView',
    'OrderExtendDeadlineView',
    # Milestone views
    'MilestoneListView',
    'MilestoneCreateView',
    'MilestoneDetailView',
    'MilestoneStartView',
    'MilestoneSubmitView',
    'MilestoneApproveView',
    'MilestoneRevisionView',
    # Deliverable views
    'DeliverableUploadView',
    'DeliverableListView',
    'DeliverableDeleteView',
]
