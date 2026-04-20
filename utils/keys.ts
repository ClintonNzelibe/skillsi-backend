import * as dotenv from 'dotenv';
dotenv.config();

export const OPENAI_API_KEY = process.env['OPENAI_API_KEY'];
// export const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export const GOOGLE_DRIVE_APIKEY = process.env.GOOGLE_DRIVE_APIKEY

// export const PAYSTACK_SECRET_KEY =
//   process.env.NODE_ENV === "production"
//     ? process.env.PAYSTACK_SECRET_LIVE_KEY
//     : process.env.PAYSTACK_SECRET_LIVE_KEY || "";

    export const PAYSTACK_SECRET_KEY =
      process.env.NODE_ENV === "production"
        ? process.env.PAYSTACK_SECRET_LIVE_KEY
        : process.env.PAYSTACK_SECRET_KEY;