export default function Custom500(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">500 - Server Error</h1>
      <p className="mt-4 text-gray-600">Something went wrong on our end.</p>
    </div>
  );
}
