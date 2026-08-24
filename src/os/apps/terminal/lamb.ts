/**
 * A miniature Lamb.
 *
 * Deebyanshu's Lamb is a tree-walk interpreter written in Java. This is a small
 * but genuine implementation of the same pipeline — scanner → recursive-descent
 * parser → AST → environment-chained evaluator — so the easter egg in the
 * terminal actually *runs* the language rather than printing canned output.
 *
 * Supported: var, assignment, arithmetic, comparison, and/or, if/else, while,
 * for, blocks with lexical scope, first-class functions, closures, recursion,
 * return, print, strings, numbers, booleans, nil.
 */

type TokenType =
  | "(" | ")" | "{" | "}" | "," | "-" | "+" | ";" | "/" | "*"
  | "!" | "!=" | "=" | "==" | ">" | ">=" | "<" | "<="
  | "IDENT" | "STRING" | "NUMBER"
  | "and" | "else" | "false" | "fun" | "for" | "if" | "nil" | "or"
  | "print" | "return" | "true" | "var" | "while" | "EOF";

type Token = { type: TokenType; lexeme: string; literal?: unknown; line: number };

const KEYWORDS: Record<string, TokenType> = {
  and: "and", else: "else", false: "false", fun: "fun", for: "for", if: "if",
  nil: "nil", or: "or", print: "print", return: "return", true: "true",
  var: "var", while: "while",
};

export class LambError extends Error {}

/* ── scanner ─────────────────────────────────────────────────── */

function scan(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  const peek = (o = 0) => src[i + o] ?? "\0";
  const add = (type: TokenType, lexeme: string, literal?: unknown) =>
    tokens.push({ type, lexeme, literal, line });

  while (i < src.length) {
    const c = src[i];
    if (c === "\n") { line++; i++; continue; }
    if (c === " " || c === "\t" || c === "\r") { i++; continue; }
    if (c === "/" && peek(1) === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if ("(){},-+;*".includes(c)) { add(c as TokenType, c); i++; continue; }
    if (c === "/") { add("/", c); i++; continue; }
    if ("!=<>".includes(c)) {
      const two = peek(1) === "=";
      const lex = two ? c + "=" : c;
      add(lex as TokenType, lex);
      i += two ? 2 : 1;
      continue;
    }
    if (c === '"') {
      let s = "";
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === "\n") line++;
        s += src[i++];
      }
      if (i >= src.length) throw new LambError(`Unterminated string on line ${line}.`);
      i++;
      add("STRING", `"${s}"`, s);
      continue;
    }
    if (/[0-9]/.test(c)) {
      let n = "";
      while (/[0-9]/.test(peek())) n += src[i++];
      if (peek() === "." && /[0-9]/.test(peek(1))) {
        n += src[i++];
        while (/[0-9]/.test(peek())) n += src[i++];
      }
      add("NUMBER", n, Number(n));
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let id = "";
      while (/[A-Za-z0-9_]/.test(peek())) id += src[i++];
      add(KEYWORDS[id] ?? "IDENT", id);
      continue;
    }
    throw new LambError(`Unexpected character '${c}' on line ${line}.`);
  }
  tokens.push({ type: "EOF", lexeme: "", line });
  return tokens;
}

/* ── AST ─────────────────────────────────────────────────────── */

type Expr =
  | { k: "literal"; value: unknown }
  | { k: "var"; name: string }
  | { k: "assign"; name: string; value: Expr }
  | { k: "unary"; op: string; right: Expr }
  | { k: "binary"; op: string; left: Expr; right: Expr }
  | { k: "logical"; op: string; left: Expr; right: Expr }
  | { k: "call"; callee: Expr; args: Expr[] }
  | { k: "group"; expr: Expr };

type Stmt =
  | { k: "expr"; expr: Expr }
  | { k: "print"; expr: Expr }
  | { k: "varDecl"; name: string; init: Expr | null }
  | { k: "block"; body: Stmt[] }
  | { k: "if"; cond: Expr; then: Stmt; else: Stmt | null }
  | { k: "while"; cond: Expr; body: Stmt }
  | { k: "fun"; name: string; params: string[]; body: Stmt[] }
  | { k: "return"; value: Expr | null };

/* ── parser (recursive descent) ──────────────────────────────── */

function parse(tokens: Token[]): Stmt[] {
  let i = 0;
  const peek = () => tokens[i];
  const previous = () => tokens[i - 1];
  const isAtEnd = () => peek().type === "EOF";
  const check = (t: TokenType) => !isAtEnd() && peek().type === t;
  const advance = () => (isAtEnd() ? peek() : tokens[i++]);
  const match = (...types: TokenType[]) => {
    for (const t of types) if (check(t)) { advance(); return true; }
    return false;
  };
  const consume = (t: TokenType, msg: string) => {
    if (check(t)) return advance();
    throw new LambError(`${msg} (line ${peek().line})`);
  };

  const primary = (): Expr => {
    if (match("false")) return { k: "literal", value: false };
    if (match("true")) return { k: "literal", value: true };
    if (match("nil")) return { k: "literal", value: null };
    if (match("NUMBER", "STRING")) return { k: "literal", value: previous().literal };
    if (match("IDENT")) return { k: "var", name: previous().lexeme };
    if (match("(")) {
      const e = expression();
      consume(")", "Expected ')' after expression.");
      return { k: "group", expr: e };
    }
    throw new LambError(`Expected an expression but found '${peek().lexeme || "end of input"}'.`);
  };

  const call = (): Expr => {
    let expr = primary();
    while (match("(")) {
      const args: Expr[] = [];
      if (!check(")")) {
        do {
          if (args.length >= 8) throw new LambError("Too many arguments (max 8).");
          args.push(expression());
        } while (match(","));
      }
      consume(")", "Expected ')' after arguments.");
      expr = { k: "call", callee: expr, args };
    }
    return expr;
  };

  const unary = (): Expr =>
    match("!", "-") ? { k: "unary", op: previous().type, right: unary() } : call();

  const binaryLevel = (next: () => Expr, ops: TokenType[]) => (): Expr => {
    let left = next();
    while (match(...ops)) left = { k: "binary", op: previous().type, left, right: next() };
    return left;
  };

  const factor = binaryLevel(unary, ["/", "*"]);
  const term = binaryLevel(factor, ["-", "+"]);
  const comparison = binaryLevel(term, [">", ">=", "<", "<="]);
  const equality = binaryLevel(comparison, ["!=", "=="]);

  const and = (): Expr => {
    let left = equality();
    while (match("and")) left = { k: "logical", op: "and", left, right: equality() };
    return left;
  };
  const or = (): Expr => {
    let left = and();
    while (match("or")) left = { k: "logical", op: "or", left, right: and() };
    return left;
  };

  const assignment = (): Expr => {
    const target = or();
    if (match("=")) {
      const value = assignment();
      if (target.k === "var") return { k: "assign", name: target.name, value };
      throw new LambError("Invalid assignment target.");
    }
    return target;
  };

  function expression(): Expr {
    return assignment();
  }

  const block = (): Stmt[] => {
    const body: Stmt[] = [];
    while (!check("}") && !isAtEnd()) body.push(declaration());
    consume("}", "Expected '}' after block.");
    return body;
  };

  const statement = (): Stmt => {
    if (match("print")) {
      const value = expression();
      consume(";", "Expected ';' after value.");
      return { k: "print", expr: value };
    }
    if (match("return")) {
      const value = check(";") ? null : expression();
      consume(";", "Expected ';' after return value.");
      return { k: "return", value };
    }
    if (match("if")) {
      consume("(", "Expected '(' after 'if'.");
      const cond = expression();
      consume(")", "Expected ')' after condition.");
      const then = statement();
      return { k: "if", cond, then, else: match("else") ? statement() : null };
    }
    if (match("while")) {
      consume("(", "Expected '(' after 'while'.");
      const cond = expression();
      consume(")", "Expected ')' after condition.");
      return { k: "while", cond, body: statement() };
    }
    if (match("for")) {
      // desugars to a block containing a while loop, exactly as Lamb does
      consume("(", "Expected '(' after 'for'.");
      const init = match(";") ? null : match("var") ? varDecl() : exprStatement();
      const cond = check(";") ? null : expression();
      consume(";", "Expected ';' after loop condition.");
      const step = check(")") ? null : expression();
      consume(")", "Expected ')' after for clauses.");
      let body = statement();
      if (step) body = { k: "block", body: [body, { k: "expr", expr: step }] };
      body = { k: "while", cond: cond ?? { k: "literal", value: true }, body };
      return init ? { k: "block", body: [init, body] } : body;
    }
    if (match("{")) return { k: "block", body: block() };
    return exprStatement();
  };

  function exprStatement(): Stmt {
    const expr = expression();
    // a bare expression at the top level is allowed so the REPL feels like one
    if (!match(";") && !isAtEnd()) consume(";", "Expected ';' after expression.");
    return { k: "expr", expr };
  }

  function varDecl(): Stmt {
    const name = consume("IDENT", "Expected a variable name.").lexeme;
    const init = match("=") ? expression() : null;
    consume(";", "Expected ';' after variable declaration.");
    return { k: "varDecl", name, init };
  }

  function declaration(): Stmt {
    if (match("fun")) {
      const name = consume("IDENT", "Expected a function name.").lexeme;
      consume("(", "Expected '(' after function name.");
      const params: string[] = [];
      if (!check(")")) {
        do params.push(consume("IDENT", "Expected a parameter name.").lexeme);
        while (match(","));
      }
      consume(")", "Expected ')' after parameters.");
      consume("{", "Expected '{' before function body.");
      return { k: "fun", name, params, body: block() };
    }
    if (match("var")) return varDecl();
    return statement();
  }

  const program: Stmt[] = [];
  while (!isAtEnd()) program.push(declaration());
  return program;
}

/* ── runtime ─────────────────────────────────────────────────── */

class Environment {
  private values = new Map<string, unknown>();
  constructor(readonly parent: Environment | null = null) {}
  define(name: string, value: unknown) {
    this.values.set(name, value);
  }
  get(name: string): unknown {
    if (this.values.has(name)) return this.values.get(name);
    if (this.parent) return this.parent.get(name);
    throw new LambError(`Undefined variable '${name}'.`);
  }
  assign(name: string, value: unknown): void {
    if (this.values.has(name)) {
      this.values.set(name, value);
      return;
    }
    if (this.parent) {
      this.parent.assign(name, value);
      return;
    }
    throw new LambError(`Undefined variable '${name}'.`);
  }
}

type LambFunction = {
  __lamb: true;
  name: string;
  params: string[];
  body: Stmt[];
  closure: Environment;
};

class ReturnSignal {
  constructor(readonly value: unknown) {}
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return "nil";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(v);
  if (typeof v === "object" && (v as LambFunction).__lamb)
    return `<fn ${(v as LambFunction).name}>`;
  return String(v);
}

const truthy = (v: unknown) => v !== null && v !== undefined && v !== false;

/** A persistent Lamb session, so the REPL keeps state between lines. */
export class LambSession {
  private globals = new Environment();
  private steps = 0;
  private out: string[] = [];

  run(source: string): string[] {
    this.out = [];
    this.steps = 0;
    const stmts = parse(scan(source));
    for (const stmt of stmts) this.exec(stmt, this.globals);
    return this.out;
  }

  private guard() {
    // recursion and loops are real here, so the REPL needs a real fuse
    if (++this.steps > 200_000)
      throw new LambError("Execution budget exhausted — is that loop terminating?");
  }

  private exec(stmt: Stmt, env: Environment): void {
    this.guard();
    switch (stmt.k) {
      case "expr": {
        const v = this.evaluate(stmt.expr, env);
        // echo the value of a bare top-level expression, REPL-style
        if (env === this.globals && stmt.expr.k !== "assign") this.out.push(stringify(v));
        return;
      }
      case "print":
        this.out.push(stringify(this.evaluate(stmt.expr, env)));
        return;
      case "varDecl":
        env.define(stmt.name, stmt.init ? this.evaluate(stmt.init, env) : null);
        return;
      case "block": {
        const scope = new Environment(env);
        for (const s of stmt.body) this.exec(s, scope);
        return;
      }
      case "if":
        if (truthy(this.evaluate(stmt.cond, env))) this.exec(stmt.then, env);
        else if (stmt.else) this.exec(stmt.else, env);
        return;
      case "while":
        while (truthy(this.evaluate(stmt.cond, env))) {
          this.guard();
          this.exec(stmt.body, env);
        }
        return;
      case "fun": {
        const fn: LambFunction = {
          __lamb: true,
          name: stmt.name,
          params: stmt.params,
          body: stmt.body,
          closure: env,
        };
        env.define(stmt.name, fn);
        return;
      }
      case "return":
        throw new ReturnSignal(stmt.value ? this.evaluate(stmt.value, env) : null);
    }
  }

  private evaluate(expr: Expr, env: Environment): unknown {
    this.guard();
    switch (expr.k) {
      case "literal":
        return expr.value;
      case "group":
        return this.evaluate(expr.expr, env);
      case "var":
        return env.get(expr.name);
      case "assign": {
        const value = this.evaluate(expr.value, env);
        env.assign(expr.name, value);
        return value;
      }
      case "unary": {
        const right = this.evaluate(expr.right, env);
        if (expr.op === "!") return !truthy(right);
        if (typeof right !== "number") throw new LambError("Operand must be a number.");
        return -right;
      }
      case "logical": {
        const left = this.evaluate(expr.left, env);
        if (expr.op === "or") return truthy(left) ? left : this.evaluate(expr.right, env);
        return truthy(left) ? this.evaluate(expr.right, env) : left;
      }
      case "binary": {
        const l = this.evaluate(expr.left, env);
        const r = this.evaluate(expr.right, env);
        switch (expr.op) {
          case "+":
            if (typeof l === "number" && typeof r === "number") return l + r;
            if (typeof l === "string" || typeof r === "string")
              return stringify(l) + stringify(r);
            throw new LambError("Operands must be two numbers or include a string.");
          case "-": case "*": case "/":
          case ">": case ">=": case "<": case "<=": {
            if (typeof l !== "number" || typeof r !== "number")
              throw new LambError(`Operands of '${expr.op}' must be numbers.`);
            switch (expr.op) {
              case "-": return l - r;
              case "*": return l * r;
              case "/":
                if (r === 0) throw new LambError("Division by zero.");
                return l / r;
              case ">": return l > r;
              case ">=": return l >= r;
              case "<": return l < r;
              default: return l <= r;
            }
          }
          case "==": return l === r;
          case "!=": return l !== r;
          default: throw new LambError(`Unknown operator '${expr.op}'.`);
        }
      }
      case "call": {
        const callee = this.evaluate(expr.callee, env);
        const args = expr.args.map((a) => this.evaluate(a, env));
        if (!callee || typeof callee !== "object" || !(callee as LambFunction).__lamb)
          throw new LambError("Can only call functions.");
        const fn = callee as LambFunction;
        if (args.length !== fn.params.length)
          throw new LambError(
            `${fn.name}() expects ${fn.params.length} argument(s) but got ${args.length}.`,
          );
        const scope = new Environment(fn.closure);
        fn.params.forEach((p, idx) => scope.define(p, args[idx]));
        try {
          for (const s of fn.body) this.exec(s, scope);
        } catch (e) {
          if (e instanceof ReturnSignal) return e.value;
          throw e;
        }
        return null;
      }
    }
  }
}

/** The program shown when the terminal drops into Lamb. */
export const LAMB_SAMPLE = [
  "fun fib(n) {",
  "  if (n <= 1) return n;",
  "  return fib(n - 1) + fib(n - 2);",
  "}",
  "print fib(12);",
].join("\n");
