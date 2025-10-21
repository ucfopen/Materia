def parse_bool(val: str, default=False) -> bool:
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.strip().lower() in ["true", "1", "yes"]
    return default
