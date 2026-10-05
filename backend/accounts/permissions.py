from rest_framework import permissions

def is_executive_or_staff(user):
    """
    Returns True if user is authenticated and is staff, superuser,
    or has an executive role (OWNER, ADMIN, OFFICER) or active officer title.
    """
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    if getattr(user, 'role', '') in ['OWNER', 'ADMIN', 'OFFICER']:
        return True
    officer_title = getattr(user, 'officer_title', '')
    if officer_title and officer_title != 'NONE':
        return True
    if getattr(user, 'is_executive_officer', False):
        return True
    return False


class IsExecutiveOrStaff(permissions.BasePermission):
    """
    Permission class allowing access only to staff, superusers, or executive club officers.
    """
    message = 'Access restricted to executive officers and staff.'

    def has_permission(self, request, view):
        return is_executive_or_staff(request.user)


class IsPresidentOrVicePresident(permissions.BasePermission):
    """
    Permission class allowing access only to the Club President (Owner),
    Vice President, or superusers.
    """
    message = 'Access restricted to the Club President and Vice President.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role = getattr(request.user, 'role', '')
        title = getattr(request.user, 'officer_title', '')
        return role == 'OWNER' or title in ['PRESIDENT', 'VICE_PRESIDENT']

