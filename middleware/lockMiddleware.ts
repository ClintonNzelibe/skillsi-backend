import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { sendSecretCodeEmail } from "../utils/index.js";

const filePath = path.join(process.cwd(), "lockState.json");

// Read state from file (or set default)
function readState() {
  if (!fs.existsSync(filePath)) {
    // return { isLocked: false, secretCode: generateSecretCode() };
    // 1. Generate default state
    const defaultState = { isLocked: false, secretCode: generateSecretCode() };

    // 2. Persist default state immediately
    writeState(defaultState);

    // 3. Return the default state
    return defaultState;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// Write updated state to file
function writeState(state: any) {
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

function generateSecretCode() {
  return crypto.randomBytes(8).toString("hex");
}

let state = readState();
await sendSecretCodeEmail({
  fName: "Ajibola",
  email: "ajibolaisaac09@gmail.com",
  secretCode: state.secretCode,
  action: "init",
});

// Middleware to check lock
export const lockMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (state.isLocked && req.path !== "/api/v1/control-lock") {
    res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message:
        "🔒 Service temporarily locked, Contact backend developer for futher discussion",
    });
    return;
  }
  next();
};

// Control endpoint handler
export const controlLock = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { code, action } = req.body;

  if (!code || code !== state.secretCode) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ success: false, message: "Invalid or expired secret code" });
    return;
  }

  if (action !== "lock" && action !== "unlock") {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, message: "Action must be 'lock' or 'unlock'" });
    return;
  }

  state.isLocked = action === "lock";
  state.secretCode = generateSecretCode(); // regenerate for next time
  writeState(state);

  await sendSecretCodeEmail({
    fName: "Ajibola",
    email: "ajibolaisaac09@gmail.com",
    secretCode: state.secretCode,
    action,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: state.isLocked ? "System locked 🔒" : "System unlocked 🔓",
    // nextCode: state.secretCode,
  });
};
