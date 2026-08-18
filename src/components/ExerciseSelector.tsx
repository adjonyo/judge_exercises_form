import { EXERCISES } from "../exercises";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function ExerciseSelector({ selected, onSelect }: Props) {
  const categories = {
    compound: EXERCISES.filter((e) => e.category === "compound"),
    isolation: EXERCISES.filter((e) => e.category === "isolation"),
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-400 mb-2">Select Exercise</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {Object.entries(categories).map(([, exercises]) =>
          exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selected === ex.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {ex.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
