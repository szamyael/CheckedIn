import { createClient as createAdminClient } from "@supabase/supabase-js";

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function writeApiLog(entry: {
  method: ApiMethod;
  path: string;
  statusCode: number;
  durationMs: number;
  createdAt: string;
}) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error("Supabase server credentials are unavailable");
    }

    const { error } = await createAdminClient(url, serviceKey)
      .from("api_request_logs")
      .insert({
        method: entry.method,
        path: entry.path,
        status_code: entry.statusCode,
        duration_ms: entry.durationMs,
        created_at: entry.createdAt,
      });

    if (error) throw error;
  } catch (error) {
    console.error("Could not record API request metadata", error);
  }
}

export function withApiLogging<Args extends unknown[]>(
  method: ApiMethod,
  path: string,
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    const startedAt = Date.now();
    const createdAt = new Date(startedAt).toISOString();
    let response: Response;

    try {
      response = await handler(...args);
    } catch (error) {
      await writeApiLog({
        method,
        path,
        statusCode: 500,
        durationMs: Date.now() - startedAt,
        createdAt,
      });
      throw error;
    }

    await writeApiLog({
      method,
      path,
      statusCode: response.status,
      durationMs: Date.now() - startedAt,
      createdAt,
    });
    return response;
  };
}
