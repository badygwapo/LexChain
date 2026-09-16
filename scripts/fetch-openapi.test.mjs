import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(new URL("./fetch-openapi.mjs", import.meta.url));
const originalContract = '{"openapi":"3.0.0","paths":{"/original":{}}}\n';

async function withFixture(run) {
  const directory = await mkdtemp(join(tmpdir(), "lexchain-openapi-"));
  const outputPath = join(directory, "openapi.json");
  await writeFile(outputPath, originalContract);

  try {
    await run({ directory, outputPath });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function withServer(handler, run) {
  const server = createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}/openapi.json?token=secret-value`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

function runRefresh(outputPath, sourceUrl) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, OPENAPI_OUTPUT_PATH: outputPath };
    if (sourceUrl === undefined) delete env.OPENAPI_URL;
    else env.OPENAPI_URL = sourceUrl;

    const child = spawn(process.execPath, [scriptPath], { env });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function assertFailurePreservesFixture(handler) {
  await withFixture(async ({ directory, outputPath }) => {
    await withServer(handler, async (url) => {
      const result = await runRefresh(outputPath, url);
      assert.notEqual(result.code, 0);
      assert.equal(await readFile(outputPath, "utf8"), originalContract);
      assert.equal(result.stderr.includes("secret-value"), false);
      assert.deepEqual(await readdir(directory), ["openapi.json"]);
    });
  });
}

test("writes a valid contract atomically and exits zero when unchanged", async () => {
  const contract = { openapi: "3.1.0", paths: { "/documents": {} } };

  await withFixture(async ({ directory, outputPath }) => {
    await withServer((_request, response) => {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify(contract));
    }, async (url) => {
      const first = await runRefresh(outputPath, url);
      assert.equal(first.code, 0, first.stderr);
      assert.deepEqual(JSON.parse(await readFile(outputPath, "utf8")), contract);
      assert.deepEqual(await readdir(directory), ["openapi.json"]);

      const second = await runRefresh(outputPath, url);
      assert.equal(second.code, 0, second.stderr);
      assert.match(second.stdout, /already up to date/);
    });
  });
});

test("preserves the existing contract on HTTP 500", () =>
  assertFailurePreservesFixture((_request, response) => {
    response.statusCode = 500;
    response.end("server error");
  }));

test("preserves the existing contract on invalid JSON", () =>
  assertFailurePreservesFixture((_request, response) => response.end("not json")));

test("preserves the existing contract when the response is malformed", () =>
  assertFailurePreservesFixture((_request, response) =>
    response.end(JSON.stringify({ openapi: "3.1.0" })),
  ));

test("requires OPENAPI_URL and preserves the existing contract", async () => {
  await withFixture(async ({ directory, outputPath }) => {
    const result = await runRefresh(outputPath);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /OPENAPI_URL is required/);
    assert.equal(await readFile(outputPath, "utf8"), originalContract);
    assert.deepEqual(await readdir(directory), ["openapi.json"]);
  });
});

test("does not print credentials from a malformed URL", async () => {
  await withFixture(async ({ outputPath }) => {
    const result = await runRefresh(outputPath, "http://user:secret@[invalid");
    assert.notEqual(result.code, 0);
    assert.equal(result.stderr.includes("user:secret"), false);
    assert.equal(await readFile(outputPath, "utf8"), originalContract);
  });
});
