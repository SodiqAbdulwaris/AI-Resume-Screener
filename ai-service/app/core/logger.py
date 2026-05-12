import logging
import sys
import json
from datetime import datetime

from app.core.context import request_id_var

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "time": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "name": record.name,
            "request_id": request_id_var.get(),
        }

        return json.dumps(log_entry)
 
def get_logger(name: str = "app"):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    if not logger.handlers:
        logger.addHandler(handler)

    return logger

logger = get_logger("resume-parser")
