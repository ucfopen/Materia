import re

from django.conf import settings

import logging
logger = logging.getLogger('django')

class ValidatorUtil():

    # Stand-in for PHP's is_numeric function, which accepts numbers or strings
    # 23    # True
    # 23.5  # True
    # -2    # True
    # "23"  # True
    # "23a" # False
    # None  # False
    # ""    # False
    # "-2"  # True
    # 0     # True

    # return bool True if var is a number
    # return bool False if var is not a number
    def is_numeric(var):
        try:
            var = float(var)
            return True
        except ValueError:
            return False

    # Checks if var is a whole integer - this includes negative numbers
    # 23    # True
    # 23.5  # False
    # -2    # True
    # "23"  # True
    # "23a" # False
    # None  # False
    # ""    # False
    # "-2"  # True
    # 0     # True

    # return bool True if var is a whole integer
    # return bool False if var is not a whole integer
    def is_int(var):
        try:
            var = float(var)
            return int(var) == float(var)
        except ValueError:
            return False

    # previously 'is_pos_int'
    # Checks if var is a positive integer
    # 23    # True
    # 23.5  # False
    # -2    # True
    # "23"  # True
    # "23a" # False
    # None  # False
    # ""    # False
    # "-2"  # False
    # 0     # True if allow_zero is True

    # return bool True if var is a whole integer
    # return bool False if var is not a whole integer
    def is_positive_integer_or_zero(var, allow_zero = False):
        try:
            if not ValidatorUtil.is_int(var): return False
            if allow_zero:
                return int(var) >= 0
            else:
                return int(var) > 0
        except ValueError:
            return False

    # Ensures $hash is a valid alphanumeric, five-character string

    # return bool True if hash is a valid string
    # return bool False if hash is an invalid string
    def is_valid_hash(hash):
        if ValidatorUtil.is_numeric(hash) and ValidatorUtil.is_positive_integer_or_zero(hash): return True

        # matches any alphanumeric string between 1 and 5 characters EXCEPT 0
        pattern = re.compile(r'^([A-Za-z0-9]{2,5}|[A-Za-z1-9]{1})')
        if type(hash) == str and bool(re.match(pattern, hash)): return True

        return False

    # Convenience function to make sure a value is a non-empty string
    def is_string(var):
        return type(var) == str and len(var) > 0

    # Ensures long_hash is a valid base64 hash and supports old play ids
    #  can't just be '0' or '-'
    #  can't start with '-'
    #  only contains alphanumeric and - characters
    # Can also be a uuid v4

    # return bool True if long_hash is a valid string
    # return bool False if long_hash is an invalid string

    # public static function is_valid_long_hash($long_hash)
    # {
    #     if ( ! self::is_string($long_hash)) return false;
    #     if ($long_hash === '0') return false;
    #     $pattern = '/^[A-Za-z0-9][A-Za-z0-9-]*\z/';
    #     return (preg_match($pattern, $long_hash, $match) === 1);
    # }
    def is_valid_long_hash(long_hash):
        if not ValidatorUtil.is_string(long_hash): return False
        if long_hash == '0': return False

        pattern = re.compile(r'/^[A-Za-z0-9][A-Za-z0-9-]*\z/')
        return bool(re.match(pattern, long_hash))

    def is_md5(var):
        pattern = re.compile(r'/^[[a-zA-Z0-9]]{32}$/i')
        return bool(re.match(pattern, var))

    def is_sha5(var):
        pattern = re.compile(r'/^[[a-zA-Z0-9]]{40}$/i')
        return bool(re.match(pattern, var))

    # intentionally not recreating cast_to_bool_enum function, since
    #  the Django ORM and our model definitions should handle that
