import express, { Request, Response } from "express";
import dotenv from "dotenv";
import "express-async-errors";
import morgan from "morgan";
import cors from "cors";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import notFoundMiddleware from "./middleware/not-found.js";
import errorHandlerMiddleware from "./middleware/error-handler.js";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import swagger from "./swagger.json";

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
import authRouter from "./routes/authRoutes.js";
const connectionString = process.env.MONGO_URL || "";

// Middleware setup
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.set("trust proxy", 1);
app.use(express.json({ limit: "100000000mb" }));
app.use(express.urlencoded({ limit: "100000000mb", extended: true }));
app.use(xss());
app.use(mongoSanitize());

// app.use(cors());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

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

// Apply DB middleware only to routes that need database access
app.use("/api/v1", dbMiddleware);
app.use("/api/v1", apiKeyMiddleware);

// Add your API routes here
// app.use("/api/v1/company", companyRouter);
app.use("/api/v1/auth", authRouter);
// app.use("/api/v1/admin", adminRouter);
// app.use("/api/v1/user", userRouter);
// app.use("/api/v1/training", awarenessTrainingRouter);
// app.use("/api/v1/template", phishingTemplateRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5500;

  // Connect to database first, then start server
  connectToDatabase(connectionString)
    .then(() => {
      app.listen(port, () => {
        console.log(`Server is listening on port ${port}...`);
      });
    })
    .catch((error) => {
      console.error("Failed to connect to database:", error);
      process.exit(1);
    });
  // app.listen(port, () => {
  //   console.log(`Server is listening on port ${port}...`);
  // });
}

export default app;
