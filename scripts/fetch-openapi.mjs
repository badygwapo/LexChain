#!/usr/bin/env node
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = process.env.OPENAPI_OUTPUT_PATH
  ? resolve(process.env.OPENAPI_OUTPUT_PATH)
  : resolve(scriptDirectory, "../openapi-updated.json");

function fail(message) {
  console.error(`Failed to refresh OpenAPI contract: ${message}`);
  process.exitCode = 1;
}

function isOpenApiContract(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.openapi === "string" &&
    value.openapi.length > 0 &&
    value.paths !== null &&
    typeof value.paths === "object" &&
    !Array.isArray(value.paths)
  );
}

const sourceUrl = process.env.OPENAPI_URL;

if (!sourceUrl) {
  fail("OPENAPI_URL is required.");
} else {
  try {
    let parsedUrl;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      throw new Error("OPENAPI_URL must be a valid HTTP or HTTPS URL");
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("OPENAPI_URL must be a valid HTTP or HTTPS URL");
    }

    let response;
    try {
      response = await fetch(parsedUrl, {
        headers: { "ngrok-skip-browser-warning": "true" },
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new Error("request failed");
    }

    if (!response.ok) {
      throw new Error(`server returned HTTP ${response.status}`);
    }

    let contract;
    try {
      contract = await response.json();
    } catch {
      throw new Error("response was not valid JSON");
    }

    if (!isOpenApiContract(contract)) {
      throw new Error("response was not an OpenAPI contract");
    }

    const nextContents = `${JSON.stringify(contract, null, 2)}\n`;
    const currentContents = await readFile(outputPath, "utf8").catch(() => "");

    if (nextContents === currentContents) {
      console.log("OpenAPI contract is already up to date.");
    } else {
      const temporaryPath = resolve(
        dirname(outputPath),
        `.${basename(outputPath)}.${process.pid}.${crypto.randomUUID()}.tmp`,
      );

      try {
        await writeFile(temporaryPath, nextContents, { flag: "wx" });
        await rename(temporaryPath, outputPath);
      } finally {
        await unlink(temporaryPath).catch(() => {});
      }

      console.log(`Updated ${basename(outputPath)}.`);
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : "unknown error");
  }
}
