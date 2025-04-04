import * as dotenv from 'dotenv';
dotenv.config();

export const OPENAI_API_KEY = process.env['OPENAI_API_KEY'];
// export const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export const GOOGLE_DRIVE_APIKEY = process.env.GOOGLE_DRIVE_APIKEY

export const STRIPE_SECRET_KEY = process.env.SECRET_STRIPE_SECRET_KEY || ""

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ""