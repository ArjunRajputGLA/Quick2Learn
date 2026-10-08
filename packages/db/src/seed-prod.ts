import { seedProduction } from "./seed";

seedProduction()
  .then(() => {
    console.log("Production seed (subjects, chapters, site_settings) completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Production seeding failed:", err);
    process.exit(1);
  });
