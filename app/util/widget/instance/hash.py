class WidgetInstanceHash():
    # no idea how these were originally determined or if they're significant
    GOLDEN_PRIMES = [
        1,
        41,
        2377,
        147299,
        9132313,
        566201239,
        35104476161,
        2176477521929
    ]

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
        from math import floor
        key = ''
        while num > 0:
            mod = num % 62
            key += chr(WidgetInstanceHash.CHARACTER_CODES[mod])
            num = floor(num / 62)
        # return the reversed result of the above process
        return key[::-1]

    #TODO: this is stupid, do it better
    def generate_key_hash(length = 5):
        from math import floor
        from sys import maxsize
        from random import randint
        # this number is big enough, whatever
        big_number = min(2147483647, maxsize)
        num = randint(1, big_number)
        ceil = pow(62, length)
        prime = WidgetInstanceHash.GOLDEN_PRIMES[length]
        dec = (num * prime) - floor(num * prime / ceil) * ceil
        hash = WidgetInstanceHash.base62(dec)
        # pad the hash with leading zeros up to the specified length
        return hash.zfill(length)

    # maybe just find all the places this is called and use uuid4 directly instead
    def generate_long_hash():
        from uuid import uuid4
        return uuid4()
