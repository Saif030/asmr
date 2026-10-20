/**
 * Manually add a user to the admins team.
 *
 * Usage: node tools/make-admin.mjs <email>
 *
 * This is useful if the automatic admin assignment during signup failed.
 */

import { Client, Users, Teams, TablesDB, Query } from "node-appwrite";
import { readFileSync } from "fs";
import { join } from "path";

// Load env variables
const envPath = join(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");

const envVars = {};
envContent.split("\n").forEach((line) => {
  const [key, ...valueParts] = line.split("=");
  if (key && !key.startsWith("#") && valueParts.length > 0) {
    const value = valueParts.join("=").trim().replace(/^"|"$/g, "");
    envVars[key.trim()] = value;
  }
});

const endpoint = envVars.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = envVars.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = envVars.APPWRITE_API_KEY;
const adminTeamId = envVars.APPWRITE_ADMIN_TEAM_ID || "admins";
const databaseId = envVars.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "khatmal";

if (!endpoint || !projectId || !apiKey) {
  console.error("Missing required environment variables. Check .env.local");
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: node tools/make-admin.mjs <email>");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const users = new Users(client);
const teams = new Teams(client);
const tables = new TablesDB(client);

async function main() {
  console.log(`Looking up user with email: ${email}`);

  // Find user by email
  const userResponse = await users.list([Query.equal("email", email)]);
  if (userResponse.total === 0) {
    console.error("User not found with that email");
    process.exit(1);
  }

  const user = userResponse.users[0];
  console.log(`Found user: ${user.name} (${user.$id})`);

  // Check if already in admins team
  try {
    await teams.getMembership(adminTeamId, user.$id);
    console.log("User is already an admin in the team");
    process.exit(0);
  } catch {
    console.log("User is not in the admins team, adding now...");
  }

  // Add to admins team
  try {
    await teams.createMembership({
      teamId: adminTeamId,
      roles: ["admin"],
      userId: user.$id,
    });
    console.log("✓ Successfully added user to admins team");
  } catch (error) {
    console.error("Failed to add to admins team:", error.message);
    process.exit(1);
  }

  // Update profile isAdmin flag
  try {
    const profiles = await tables.listRows({
      databaseId,
      tableId: "profiles",
      queries: [Query.equal("userId", user.$id), Query.limit(1)],
    });

    if (profiles.total > 0) {
      const profile = profiles.rows[0];
      await tables.updateRow({
        databaseId,
        tableId: "profiles",
        rowId: profile.$id,
        data: { isAdmin: true },
      });
      console.log("✓ Updated profile isAdmin flag to true");
    }
  } catch (error) {
    console.error("Failed to update profile:", error.message);
  }

  console.log("\nDone! The user should now have admin access.");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
