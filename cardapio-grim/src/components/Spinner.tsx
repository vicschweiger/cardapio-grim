// src/components/Spinner.tsx

const Spinner = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>
    </div>
  );
};

export default Spinner;