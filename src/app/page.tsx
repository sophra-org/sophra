export default function HomePage(): JSX.Element {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Sophra Data Layer</h1>
      <p className="mb-4">
        This is the data synchronization and management layer for Sophra. The
        primary interface is through the API endpoints.
      </p>
      <div className="rounded bg-gray-100 p-4">
        <h2 className="mb-2 text-xl font-semibold">Available Endpoints:</h2>
        <ul className="list-inside list-disc">
          <li>
            <code className="rounded bg-gray-200 px-2 py-1">
              GET /api/health
            </code>
            {' - Check system health status'}
          </li>
        </ul>
      </div>
    </div>
  );
}
