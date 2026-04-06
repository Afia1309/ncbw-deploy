from django.contrib import admin

from .models import (
    CourseMemberAccess,
    CoursePositionAccess,
    Item,
    ItemMemberAccess,
    ItemPositionAccess,
    ItemProgress,
    Module,
)

admin.site.register(Module)
admin.site.register(Item)
admin.site.register(CoursePositionAccess)
admin.site.register(CourseMemberAccess)
admin.site.register(ItemPositionAccess)
admin.site.register(ItemMemberAccess)
admin.site.register(ItemProgress)