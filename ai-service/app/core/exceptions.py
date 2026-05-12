
class AppException(Exception):

    def __init__(self, message: str, error_code: str = "APP_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)

        
class UnsupportedFileTypeError(AppException):
    def __init__(self):
        super().__init__(
            message="Only PDF and DOCX files are supported",
            error_code="UNSUPPORTED_FILE_TYPE"
        )

class FileTooLargeError(AppException):
    def __init__(self, filename: str, size_mb: float, max_mb: float):
        super().__init__(
            message=f"File '{filename}' exceeds the maximum allowed size of {max_mb}MB (uploaded: {size_mb}MB)",
            error_code="FILE_TOO_LARGE"
        )


class EmptyResumeError(AppException):
    def __init__(self):
        super().__init__(
            message="Uploaded resume contains no readable content",
            error_code="EMPTY_RESUME"
        )

class ResumeParsingError(AppException):
    def __init__(self, detail: str = "Failed to parse resume"):
        super().__init__(
            message=detail,
            error_code="RESUME_PARSING_ERROR"
        )

class EmbeddingGenerationError(AppException):
    def __init__(self):
        super().__init__(
            message="Failed to generate embeddings",
            error_code="EMBEDDING_ERROR"
        )        
