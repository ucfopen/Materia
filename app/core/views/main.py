from django.http import HttpResponse

def home(request):
    return HttpResponse('this is Materia')
