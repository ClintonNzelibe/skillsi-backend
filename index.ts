import express, { Request, Response } from "express";
import dotenv from "dotenv";
import "express-async-errors";
import morgan from "morgan";
import cors from "cors";
import xss from "xss-clean";
import mongoose from "mongoose";
import mongoSanitize from "express-mongo-sanitize";

import notFoundMiddleware from "./middleware/not-found.js";
import errorHandlerMiddleware from "./middleware/error-handler.js";
import { controlLock, lockMiddleware } from "./middleware/lockMiddleware.js";

import swaggerUi from "swagger-ui-express";
import swagger from "./swagger.json" with { type: 'json' };

// import bodyParser from "body-parser";

import { AgendaSetup } from './services/index.js';


// Set up Swagger UI with specific options
const options = {
  swaggerOptions: {
    docExpansion: "list",
    deepLinking: true,
    displayRequestDuration: true,
  },
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Skillsi API Documentation",
  swaggerVersion: "4.18.3", // Try specifying a version
};

const app = express();
dotenv.config();

// connect to database
import connectToDatabase from "./db/connect.js";
import apiKeyMiddleware from "./middleware/api-key.js";

// routers
import userAuthRouter from "./routes/userAuthRoutes.js";
import tutorAuthRouter from "./routes/tutorAuthRoutes.js";
import affiliateAuthRouter from "./routes/affiliateAuthRoutes.js"
import adminAuthRouter from "./routes/adminAuthRoutes.js";
import userRouter from "./routes/userRoutes.js";
import tutorRouter from "./routes/tutorRoutes.js";
import tutorReview from "./routes/tutorReviewRoutes.js";
import affiliateRouter from "./routes/affiliateRoutes.js";
import courseRouter from "./routes/courseRoutes.js";
import courseQARouter from "./routes/courseQARoutes.js";
import courseReviewRouter from "./routes/courseReviewRoutes.js"
import purchasedCourseRouter from "./routes/purchasedCourseRoutes.js";
import wishListRouter from "./routes/wishListRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import tutorAndAffiliatePaymentRouter from "./routes/tutorAndAffiliatePaymentRoutes.js";
import paymentHistoryRouter from "./routes/paymentHistoryRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import notificationTokenRouter from "./routes/notificationTokenRoutes.js";
import shortLinkRouter from "./routes/shortLinkRoutes.js"


//webhook controller
import { paystackWebhook } from "./controllers/paymentController.js";



const connectionString = process.env.MONGO_URL || "";

// Paystack webhook route (must be BEFORE express.json())
app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  paystackWebhook
);  

// Middleware setup
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Setup Agenda and make it available throughout the app
const agenda = AgendaSetup(connectionString)
app.set('agenda', agenda);

app.use(lockMiddleware);
app.set("trust proxy", 1);
app.use(express.json({ limit: "100000000mb" }));
app.use(express.json());

// Middleware to parse JSON and raw body for webhooks
// app.use(bodyParser.json()); // For JSON payloads
// app.use(
//   bodyParser.raw({
//     type: "application/json", // Only parse JSON payloads
//   })
// );

app.use(express.urlencoded({ limit: "100000000mb", extended: true }));

app.use(xss());
app.use(mongoSanitize());

// app.use(cors());
// CORS Middleware - Move this before other middleware to handle preflight requests
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://skillsi-tutor.vercel.app", "https://skillsi-affiliate.vercel.app", "http://localhost:5173", "http://localhost:5174"]
    : ["http://localhost:5173", "http://localhost:5174"];

// Improved CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("Origin not allowed by CORS:", origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Add explicit handling for OPTIONS requests
app.options("/{*any}", cors());


// Optimized MongoDB connection
let cachedDb: typeof mongoose | null = null;

// Middleware to ensure database connection with timeout
const dbMiddleware = async (req: Request, res: Response, next: Function) => {
  try {
    if (!cachedDb) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("DB connection timeout")), 5000);
      });

      await Promise.race([connectToDatabase(connectionString), timeoutPromise]);
    }
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ error: "Unable to connect to database" });
  }
};

// Apply DB middleware only to routes that need database access
// Base route doesn't need DB connection
// Base route
app.get("/", (req: Request, res: Response) => {
  res.send(`
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet" />
        <title>Skillsi - E-Learning Platform</title>
        <style>
          body {
            background-color: black;
            color: white;
            font-family: 'Montserrat', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            flex-direction: column;
            text-align: center;
          }
          h3 {
              padding-right: 20px
          }
          a {
            text-decoration: none;
            color: white;
            font-weight: bold;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <h3>Skillsi server is running!</h3>
        <a href="/docs" >View API Docs</a>
      </body>
    </html>
  `);
});

// Serve Swagger UI at /api-docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swagger, options));

app.post("/api/v1/control-lock", controlLock);

// Apply DB middleware only to routes that need database access

app.use((req, res, next) => {
  // ✅ Skip API key for webhook
  if (req.originalUrl.startsWith("/api/v1/payment/webhook")) {
    return next();
  }

  return apiKeyMiddleware(req, res, next);
});

// Add your API routes here
app.use("/api/v1/userAuth", userAuthRouter);
app.use("/api/v1/tutorAuth", tutorAuthRouter);
app.use("/api/v1/affiliateAuth", affiliateAuthRouter);
app.use("/api/v1/adminAuth", adminAuthRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/tutor", tutorRouter);  
app.use("/api/v1/tutorReview", tutorReview);
app.use("/api/v1/affiliate", affiliateRouter);
app.use("/api/v1/course", courseRouter);
app.use("/api/v1/courseQA", courseQARouter);
app.use("/api/v1/courseReview", courseReviewRouter);
app.use("/api/v1/purchasedCourse", purchasedCourseRouter);
app.use("/api/v1/wishList", wishListRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/tutorAndAffiliatePayment", tutorAndAffiliatePaymentRouter);
app.use("/api/v1/paymentHistory", paymentHistoryRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/notificationToken", notificationTokenRouter);
app.use("/api/v1/shortLink", shortLinkRouter);


app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);


// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await agenda.stop();
  process.exit(0);
});

const port = process.env.PORT || 5000;

// Start server after database connection
connectToDatabase(connectionString)
  .then(() => {
    console.log("Database connected successfully");

    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });


export default app;
