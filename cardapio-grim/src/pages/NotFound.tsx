// src/pages/NotFound.tsx

interface NotFoundProps {
  message?: string;
}

const NotFound = ({
  message = "Restaurante não encontrado",
}: NotFoundProps) => {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-5xl">😕</h2>
      <h3 className="text-2xl font-bold">Oops!</h3>
      <p className="text-gray-600">{message}</p>
    </section>
  );
};

export default NotFound;