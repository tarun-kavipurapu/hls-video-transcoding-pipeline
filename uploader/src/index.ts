import app from "./app";

import dotenv from "dotenv";

dotenv.config();

app.listen(8000, () => {
  console.log(`Server is running on http://localhost:${8000}`);
});
