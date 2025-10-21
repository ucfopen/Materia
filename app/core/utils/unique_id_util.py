import math
import time


# based roughly on https://github.com/Riamse/python-uniqid
# which itself is based roughly on the PHP source code for uniqid:
#  https://github.com/php/php-src/blob/6bb960092a4fa6e7b1f93a482d9b23863e78d87c/ext/standard/uniqid.c
# minus the option for more entropy since we don't use it anywhere in our code
def unique_id(prefix=""):
    # number of seconds + partial seconds since unix 0
    now = time.time()
    seconds = math.floor(now)
    # number of microseconds between the current time and the current time, rounded down
    microseconds = math.floor(1000000 * (now - seconds))

    # convert the number seconds and the difference in milliseconds to hex values and concatenate them
    # minus the leading 0x
    unique_value = "%8x%05x" % (seconds, microseconds)

    return f"{prefix}{unique_value}"
