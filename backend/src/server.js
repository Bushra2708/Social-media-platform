const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const app = require("./app");
const socketService = require("./services/socketService");

dotenv.config();

const PORT = process.env.PORT || 5000;

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const server = http.createServer(app);

// Initialize Socket.io
socketService.init(server);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
