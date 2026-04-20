import mongoose from "mongoose";
// import path from "path";
const connectToDatabase = (connectionString) => {
    const options = {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // tlsCAFile: "./rds-combined-ca-bundle.pem",
    // ssl: true,
    // serverSelectionTimeoutMS: 5000,
    // socketTimeoutMS: 45000,
    // authSource: "admin",
    // directConnection: true,
    };
    return mongoose.connect(connectionString, options);
};
export default connectToDatabase;
