// Declare Node.js runtime
export const runtime = "nodejs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(): Promise<Response> {
  return new Response("API Route", {
    status: 200,
  });
}
