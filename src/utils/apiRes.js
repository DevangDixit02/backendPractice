class ApiResponse {
  constructor(status, message = 'Sucess', data) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.success = status < 400;
  }
}

export { ApiResponse };
