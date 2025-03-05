import os,sys

sys.stdout = sys.stderr

sys.path.append('/usr/local/lib/python3.12')
sys.path.append('/usr/local/lib/python3.12/site-packages')

os.environ['DJANGO_SETTINGS_MODULE'] = 'materia.settings.base'

root_path = os.path.abspath(os.path.split(__file__)[0])
sys.path.insert(0, root_path)

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
