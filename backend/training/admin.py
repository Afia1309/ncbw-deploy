from django.contrib import admin
from .models import Track, Module, Enrollment, ModuleProgress

# Register your models here.
admin.site.register(Track)
admin.site.register(Module)
admin.site.register(Enrollment)
admin.site.register(ModuleProgress)