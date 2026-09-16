import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const sourceRoot = join(process.cwd(), "src");

function serverDependency(graph, file, seen = new Set()) {
  if (seen.has(file)) return null;
  seen.add(file);
  const node = graph.get(file);
  if (!node) return null;
  if (node.server) return [file];
  for (const dependency of node.dependencies) {
    const trail = serverDependency(graph, dependency, seen);
    if (trail) return [file, ...trail];
  }
  return null;
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

async function importsFrom(directory) {
  const files = await sourceFiles(join(sourceRoot, directory));
  return Promise.all(files.map(async (file) => ({
    file: relative(sourceRoot, file),
    source: await readFile(file, "utf8"),
  })));
}

test("architecture import boundaries", async () => {
  const [shared, features, all] = await Promise.all([
    importsFrom("shared"),
    importsFrom("features"),
    sourceFiles(sourceRoot),
  ]);

  for (const { file, source } of shared) {
    assert.doesNotMatch(source, /from ["']@\/(app|features|server)\//, file);
  }
  for (const { file, source } of features) {
    assert.doesNotMatch(source, /from ["']@\/app\//, file);
  }
  for (const file of all) {
    const source = await readFile(file, "utf8");
    if (/^["']use client["'];/m.test(source)) {
      assert.doesNotMatch(source, /from ["']@\/server\//, relative(sourceRoot, file));
    }
  }
});

test("client imports cannot reach server modules through feature barrels", async () => {
  const files = (await sourceFiles(sourceRoot)).filter((file) => !/\.test\./.test(file));
  const knownFiles = new Set(files);
  const graph = new Map();
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const dependencies = [];
    let server = /(^|\/)server(\/|\.ts$)/.test(relative(sourceRoot, file)) || /^["']use server["'];/m.test(source);
    function addDependency(specifier) {
      if (["next/headers", "server-only"].includes(specifier)) server = true;
      const base = specifier.startsWith("@/")
        ? join(sourceRoot, specifier.slice(2))
        : specifier.startsWith(".") ? resolve(dirname(file), specifier) : null;
      if (!base) return;
      const target = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")].find((candidate) => knownFiles.has(candidate));
      if (target) dependencies.push(target);
    }
    function visit(node) {
      if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) {
        const bindings = node.importClause?.namedBindings;
        const typeOnly = !node.importClause?.name && bindings && ts.isNamedImports(bindings)
          && bindings.elements.length > 0 && bindings.elements.every((element) => element.isTypeOnly);
        if (!typeOnly) addDependency(node.moduleSpecifier.text);
      } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && !node.isTypeOnly) {
        if (!node.exportClause || !ts.isNamedExports(node.exportClause) || node.exportClause.elements.some((element) => !element.isTypeOnly)) {
          addDependency(node.moduleSpecifier.text);
        }
      } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) {
        addDependency(node.arguments[0].text);
      }
      ts.forEachChild(node, visit);
    }
    visit(syntax);
    graph.set(file, { server, dependencies, client: /^["']use client["'];/m.test(source) });
  }
  for (const [file, node] of graph) {
    if (!node.client) continue;
    const trail = serverDependency(graph, file);
    assert.equal(trail, null, trail?.map((part) => relative(sourceRoot, part)).join(" -> "));
  }
});

test("server dependency tracing follows reexports and tolerates cycles", () => {
  const graph = new Map([
    ["client", { dependencies: ["barrel"] }],
    ["barrel", { dependencies: ["client", "server"] }],
    ["server", { server: true, dependencies: [] }],
    ["safe", { dependencies: ["safe"] }],
  ]);
  assert.deepEqual(serverDependency(graph, "client"), ["client", "barrel", "server"]);
  assert.equal(serverDependency(graph, "safe"), null);
});
