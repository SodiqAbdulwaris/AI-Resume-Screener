import time
from contextlib import contextmanager
from app.core.logger import logger

@contextmanager
def log_time(event_name: str, extra: dict = None):
    start = time.time()

    yield

    duration_ms = (time.time() - start) * 1000

    log_data = {
        "event": event_name,
        "duration_ms": round(duration_ms, 2),
    }

    if extra:
        log_data.update(extra)

    logger.info(event_name, extra=log_data)