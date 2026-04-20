import { StatusCodes } from "http-status-codes";
const errorHandlerMiddleware = (err, req, res, next) => {
    const defaultError = {
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        message: err.message || "Something went wrong, try again later",
    };
    if (err.name === "ValidationError" && err.errors) {
        defaultError.statusCode = StatusCodes.BAD_REQUEST;
        // defaultError.message = err.message
        defaultError.message = Object.values(err.errors)
            .map((item) => item.message)
            .join(",");
    }
    if (err.code && err.code === 11000 && err.keyValue) {
        defaultError.statusCode = StatusCodes.BAD_REQUEST;
        defaultError.message = `Duplicate value entered for ${Object.keys(err.keyValue)} field, please choose another value`;
    }
    if (err.name === "CastError") {
        defaultError.statusCode = StatusCodes.NOT_FOUND;
        defaultError.message = `No item found with id : ${err.value}`;
    }
    res.status(defaultError.statusCode).json({ message: defaultError.message });
};
export default errorHandlerMiddleware;
