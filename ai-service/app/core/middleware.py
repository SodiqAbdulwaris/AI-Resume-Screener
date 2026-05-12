import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.logger import logger
from app.core.context import request_id_var


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        request_id = str(uuid.uuid4())[:8]

        # store globally for this request
        request_id_var.set(request_id)

        logger.info(
            f"Incoming request {request.method} {request.url.path}",
            extra={"request_id": request_id}
        )

        response = await call_next(request)

        logger.info(
            f"Completed request {request.method} {request.url.path}",
            extra={"request_id": request_id}
        )

        return response
