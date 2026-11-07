import app from "./src/app.js";
import connectToDB from "./src/config/db.js";
import { envConfig } from "./src/config/env.js";

const startServer = async () => {
  try {
    await connectToDB();

    app.listen(envConfig.PORT, () => {
      console.log(`Server running on port ${envConfig.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();