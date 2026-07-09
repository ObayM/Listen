import * as schema from "./schema";

type DB = any;

let cached: DB | null = null;

function init(): DB {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  if (url.includes("neon.tech")) {
    const { neon } = require("@neondatabase/serverless");
    const { drizzle } = require("drizzle-orm/neon-http");
    cached = drizzle(neon(url), { schema });
  } else {
    const { Pool } = require("pg");
    const { drizzle } = require("drizzle-orm/node-postgres");
    cached = drizzle(new Pool({ connectionString: url }), { schema });
  }
  return cached;
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = init();
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
