//
//this is a custom error class which will be used to throw errors in the application
//this Error class is coming from the nodejs check documentation in case of any doubt
class ApiError extends Error {
  public statusCode: number;
  public name: string;
  public data: any;
  public stack: any;
  public success: boolean;
  public errors: any;
  constructor(
    statusCode: number,
    message: string | "something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
    (this.data = null), //learn what is there in data field of error and why is it being amde null
      (this.success = false);
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
