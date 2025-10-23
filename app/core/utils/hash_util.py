import random
import string
from uuid import uuid4


class HashUtil:
    @staticmethod
    def generate_key_hash(length=10):
        characters = string.ascii_letters + string.digits
        return "".join(random.choices(characters, k=length))

    # maybe just find all the places this is called and use uuid4 directly instead
    @staticmethod
    def generate_long_hash():
        uuid4
