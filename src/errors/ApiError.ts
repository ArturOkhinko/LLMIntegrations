export class ApiError extends Error {
  public readonly statusCode: number;

  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  static internal(message = 'Internal Server Error'): ApiError {
    return new ApiError(500, message);
  }
}
