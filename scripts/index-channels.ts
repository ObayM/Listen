import "dotenv/config";
import { indexClips } from "../lib/indexClips";

indexClips()
  .then((summary) => {
    console.log(`\ndone: ${summary.clips} clips from ${summary.videos} videos`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
