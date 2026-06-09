import "dotenv/config";

import { migrateAllUsersLegacyCopyTypes } from "../lib/migrate-legacy-copy-types";

migrateAllUsersLegacyCopyTypes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
