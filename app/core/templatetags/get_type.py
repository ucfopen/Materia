from django import template

register = template.Library()


def get_type(value):
    return type(value).__name__


register.filter("get_type", get_type)
