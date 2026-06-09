const OWNER_KEY = "default";

const defaultState = {
  records: [],
  rateOptions: [],
  favoriteStores: [],
  favoriteMachines: [],
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

function normalizeStringList(values) {
  return Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
}

function normalizeArray(values) {
  return Array.isArray(values) ? values : [];
}

function normalizeState(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    records: normalizeArray(source.records),
    rateOptions: normalizeArray(source.rateOptions),
    favoriteStores: normalizeStringList(source.favoriteStores),
    favoriteMachines: normalizeStringList(source.favoriteMachines),
  };
}

async function ensureSchema(env) {
  await env.DB.prepare(
    "create table if not exists app_state (owner_key text primary key, state_json text not null, updated_at text not null)",
  ).run();
}

async function readState(env) {
  await ensureSchema(env);
  const row = await env.DB.prepare(
    "select state_json, updated_at from app_state where owner_key = ?",
  ).bind(OWNER_KEY).first();

  if (!row) {
    const now = new Date().toISOString();
    await env.DB.prepare(
      "insert into app_state (owner_key, state_json, updated_at) values (?, ?, ?)",
    ).bind(OWNER_KEY, JSON.stringify(defaultState), now).run();
    return { state: defaultState, updatedAt: now };
  }

  try {
    return {
      state: normalizeState(JSON.parse(row.state_json)),
      updatedAt: row.updated_at,
    };
  } catch {
    return {
      state: defaultState,
      updatedAt: row.updated_at,
    };
  }
}

async function writeState(request, env) {
  await ensureSchema(env);
  const bodyText = await request.text();
  if (bodyText.length > 2_000_000) {
    return json({ error: "too_large" }, { status: 413 });
  }

  let parsed;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return json({ error: "invalid_json" }, { status: 400 });
  }

  const state = normalizeState(parsed);
  const stateJson = JSON.stringify(state);
  const updatedAt = new Date().toISOString();
  await env.DB.prepare(
    "insert into app_state (owner_key, state_json, updated_at) values (?, ?, ?) on conflict(owner_key) do update set state_json = excluded.state_json, updated_at = excluded.updated_at",
  ).bind(OWNER_KEY, stateJson, updatedAt).run();

  return json({ state, updatedAt });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname !== "/state") {
      return json({ error: "not_found" }, { status: 404 });
    }

    if (request.method === "GET") {
      return json(await readState(env));
    }

    if (request.method === "PUT") {
      return writeState(request, env);
    }

    return json({ error: "method_not_allowed" }, { status: 405 });
  },
};
