import { Link } from "@/i18n/routing";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  count?: number;
}

interface CategoryListProps {
  categories: Category[];
}

export default function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/search?category=${category.slug}`}
          className="card card-hover p-5 sm:p-6 text-center group flex flex-col items-center gap-3"
        >
          {category.icon && (
            <span className="text-3xl leading-none" role="img" aria-label={category.name}>
              {category.icon}
            </span>
          )}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
              {category.name}
            </h3>
            {category.count !== undefined && (
              <p className="text-xs text-gray-400 mt-0.5">{category.count} businesses</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
