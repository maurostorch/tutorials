from django.conf.urls import url, include
from django.views.generic import TemplateView
from rest_framework import routers
from users import views as usr
from todo import views as todos

router = routers.DefaultRouter()
router.register(r'users', usr.UserViewSet)
router.register(r'groups', usr.GroupViewSet)
router.register(r'todos', todos.TodoViewSet)

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    url(r'^api/', include(router.urls)),
    url(r'^api-auth/',
        include('rest_framework.urls', namespace='rest_framework')),
    url(r'^$',
        TemplateView.as_view(template_name='index.html'))
]
