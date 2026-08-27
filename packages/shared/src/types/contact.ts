export interface ContactFormDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactFormResponse {
  ok: true;
  message: string;
}
