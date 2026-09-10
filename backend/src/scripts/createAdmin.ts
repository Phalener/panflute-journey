import bcrypt from "bcryptjs";
import readline from "readline";
import { db, migrate } from "../db";

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (!hidden) {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
      return;
    }
    // Simple hidden input for the password prompt.
    const stdin = process.stdin;
    process.stdout.write(question);
    let input = "";
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (char: string) => {
      if (char === "\n" || char === "\r" || char === "\u0004") {
        stdin.setRawMode?.(false);
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        rl.close();
        resolve(input);
        return;
      }
      if (char === "\u0003") process.exit(1);
      if (char === "\u007f") {
        input = input.slice(0, -1);
        return;
      }
      input += char;
    };
    stdin.on("data", onData);
  });
}

async function main() {
  await migrate();
  console.log("Create an admin user for Panflute Journey\n");

  const envEmail = process.env.ADMIN_EMAIL;
  const envPassword = process.env.ADMIN_PASSWORD;

  const email = (envEmail || (await ask("Admin email: "))).toLowerCase().trim();
  const password = envPassword || (await ask("Admin password: ", true));

  if (!email || !password || password.length < 8) {
    console.error("\nEmail is required and password must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await db.queryOne<{ id: number }>("SELECT id FROM users WHERE email = ?", [email]);
  if (existing) {
    console.error(`\nA user with email ${email} already exists.`);
    process.exit(1);
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  await db.execute("INSERT INTO users (email, password_hash) VALUES (?, ?)", [
    email,
    passwordHash,
  ]);

  console.log(`\nAdmin user created: ${email}`);
  console.log(`You can now log in at the /admin/login page of your frontend.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
