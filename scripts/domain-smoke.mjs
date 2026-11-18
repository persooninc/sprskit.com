import { checkDomain } from "../lib/domain.js";

const failures = await checkDomain();
if (failures.length) {
  for (const failure of failures) console.error("FAIL " + failure);
  process.exit(1);
}
console.log("domain smoke ok");
