// src/pages/NotFound.tsx

interface NotFoundProps {
  message?: string;
}

const NotFound = ({
  message = "Restaurante não encontrado",
}: NotFoundProps) => {
  return (
    <section className="flex h-full flex-col items-center justify-center p-4 text-center gap-5">
      <h2 className="mb-2 text-5xl">😕</h2>
      <h3 className="mb-2 text-2xl font-bold">Oops!</h3>
      <p className="text-gray-600">{message}</p>
    </section>
  );
};

export default NotFound;