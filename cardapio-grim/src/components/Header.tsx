// src/components/Header.tsx
interface HeaderProps {
  name: string;
  coverImage: string;
  isOpen: boolean;
}

const Header = ({ name, coverImage, isOpen }: HeaderProps) => (
  <header className="relative">
    <img src={coverImage} alt={`Capa de ${name}`} className="w-full h-48 object-cover" />
    <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-4">
      <h1 className="text-white text-3xl font-bold">{name}</h1>
      <span className={`text-sm font-semibold px-2 py-1 rounded-full w-fit mt-1 ${isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
        {isOpen ? 'Aberto' : 'Fechado'}
      </span>
    </div>
  </header>
);

export default Header;
