export interface Message {
  role: string;
  content: string;
  createdAt: Date;
  isRfp?: boolean;
}