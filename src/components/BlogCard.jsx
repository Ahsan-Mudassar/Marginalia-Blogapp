import { Link } from "react-router-dom";

const BlogCard = ({ blog }) => {
  if (!blog) return null;
  const { _id, title, description, image, createdAt,author } = blog;

  return (
    <Link to={`/blogs/${_id}`} className="group block h-full rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-subtle">
      <article className="card flex h-full flex-col overflow-hidden shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl">
        {image && image.url ? (
          <div className="relative h-40 overflow-hidden bg-canvas sm:h-48 md:h-52">
            <img
              src={image.url}
              alt={title || "Blog cover"}
              loading="lazy"
              className="h-full w-full object-cover "
            />
          </div>
        ) : (
          <div
            role="img"
            aria-label="No cover image available"
            className="relative flex h-40 items-center justify-center bg-linear-to-br from-brand via-brand-hover to-accent sm:h-48 md:h-52"
          >
            <span className="text-4xl font-black text-white/80 sm:text-5xl">✦</span>
          </div>
        )}

        <div className="flex flex-1 flex-col p-4 sm:p-5 md:p-6">
          <h3 className="text-base font-bold leading-snug text-ink transition-colors duration-150 group-hover:text-brand sm:text-lg">
            {title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{description}</p>
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
            <span className="max-w-[55%] truncate text-xs font-bold text-brand">
              {author || "Anonymous author"}
            </span>
            <span className="text-xs font-medium text-muted">
              {new Date(createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
