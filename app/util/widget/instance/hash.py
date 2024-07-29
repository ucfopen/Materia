from math import floor
from random import randint
from sys import maxsize
from uuid import uuid4

class WidgetInstanceHash():
    # Unicode character codes for all relevant alphanumeric characters in base62 encoding
    #  0-9, a-z, and A-Z
    # see https://en.wikipedia.org/wiki/List_of_Unicode_characters
    # and https://en.wikipedia.org/wiki/Base62
    CHARACTER_CODES = [
        # 0-9
        48,49,50,51,52,53,54,55,56,57,
        # a-z
        65,66,67,68,69,70,71,72,73,74,
        75,76,77,78,79,80,81,82,83,84,
        85,86,87,88,89,90,
        # A-Z
        97,98,99,100,101,102,103,104,
        105,106,107,108,109,110,111,
        112,113,114,115,116,117,118,
        119,120,121,122
    ]

    def base62(num):
        key = ''
        while num > 0:
            mod = num % 62
            key += chr(WidgetInstanceHash.CHARACTER_CODES[mod])
            num = floor(num / 62)
        # return the reversed result of the above process
        return key[::-1]

    def generate_key_hash(length=5):
        ceil = min(maxsize, pow(62, length))
        num = randint(1, ceil)
        hash = WidgetInstanceHash.base62(num)
        # pad the hash with leading zeros up to the specified length
        return hash.zfill(length)

    # maybe just find all the places this is called and use uuid4 directly instead
    def generate_long_hash():
        return uuid4()
