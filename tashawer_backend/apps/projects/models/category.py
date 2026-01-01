from django.db import models
from apps.core.models import BaseModel


class Category(BaseModel):
    """
    Engineering project category model.
    Categories help organize projects by engineering discipline.
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Category name in English"
    )
    name_ar = models.CharField(
        max_length=100,
        help_text="Category name in Arabic"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional description of the category"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Icon name (e.g., lucide icon name)"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this category is available for selection"
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order (lower numbers appear first)"
    )

    class Meta:
        db_table = 'project_categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name
