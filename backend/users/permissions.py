from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    message = "Only admins are allowed to access this resource."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsUser(BasePermission):
    message = "Only regular users are allowed to access this resource."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "user"


class IsAuthenticatedAndActive(BasePermission):
    message = "User must be authenticated and active."

    def has_permission(self, request, view):
        return request.user.is_authenticated
