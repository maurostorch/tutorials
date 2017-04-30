# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

# Create your models here.
class Todo(models.Model):
    _id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=30)
    desc = models.TextField(default='')
    done = models.BooleanField(default=False)
