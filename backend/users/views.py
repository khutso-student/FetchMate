from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

# Generate JWT tokens
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role  # include role in token
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "role": user.role,
    }

# ======================
# Signup
# ======================
@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    data = request.data  # DRF already parses JSON
    
    # Optional: log incoming data for debugging
    print("Signup payload:", data)
    
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    role = data.get('role', 'user').strip()

    # Validate required fields
    if not username or not email or not password:
        return Response({'error': 'All fields are required.'}, status=400)

    if len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters.'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken.'}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered.'}, status=400)

    # Create user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role
    )

    tokens = get_tokens_for_user(user)

    return Response({
        'message': 'Signup successful',
        'user': {
            'username': user.username,
            'email': user.email,
            'role': user.role
        },
        'tokens': tokens
    }, status=201)

# ======================
# Login
# ======================
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    data = request.data  # DRF already parses JSON
    
    # Optional: log incoming data for debugging
    print("Login payload:", data)
    
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not email or not password:
        return Response({'error': 'Both email and password are required.'}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Invalid credentials.'}, status=400)

    if not user.check_password(password):
        return Response({'error': 'Invalid credentials.'}, status=400)

    tokens = get_tokens_for_user(user)
    return Response({
        'message': 'Login successful',
        'user': {
            'username': user.username,
            'email': user.email,
            'role': user.role
        },
        'tokens': tokens
    })
