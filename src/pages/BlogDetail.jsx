import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ConfirmDialog from "../components/ConfirmDialog";
import { Pencil, Trash2 } from "lucide-react";
import { getBlogById, deleteBlog } from "../api/blogApi";
import Spinner from "../components/Spinner";

const BlogDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [blog, setBlog] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        const fetchBlog = async () => {
            setIsLoading(true);
            setLoadError("");
            try {
                const { data } = await getBlogById(id, { signal: controller.signal });
                
                setBlog(data.data);
            } catch (err) {
                if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
                if (err.response?.status === 404) setLoadError("This blog doesn't exist or was removed.");
                else if (!err.response) setLoadError("Network error — please check your internet connection.");
                else setLoadError("Could not load this blog. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlog();
        return () => controller.abort();
    }, [id]);

    const isOwner = user && blog?.author._id === user?._id;

    const handleDeleteConfirm = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        setDeleteError("");
        try {
            await deleteBlog(id);
            setIsDeleteOpen(false);
            navigate("/my-blogs", { replace: true });
        } catch (err) {
            if (!err.response) setDeleteError("Network error — could not delete. Please try again.");
            else if (err.response.status === 403) setDeleteError("You don't have permission to delete this blog.");
            else if (err.response.status === 404) {
                setIsDeleteOpen(false);
                navigate("/my-blogs", { replace: true });
            } else setDeleteError("Could not delete blog. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const deleteDialogMessage = deleteError || "This action cannot be undone. Are you sure you want to delete this blog?";

    if (isLoading) return <Spinner />;

    if (loadError) {
        return (
            <main className="page-shell flex min-h-[70vh] items-center justify-center px-4 py-16">
                <div className="card w-full max-w-md p-8 text-center shadow-sm">
                    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-danger-subtle text-xl font-bold text-danger">!</div>
                    <p role="alert" className="mb-6 text-muted">{loadError}</p>
                    <Link to="/" className="btn-primary inline-flex px-5 py-3">Back to all blogs</Link>
                </div>
            </main>
        );
    }

    if (!blog) return null;

    return (
            <article className="overflow-hidden rounded-3xl ">
                {blog.image?.url && (
                    <div className="relative h-64 overflow-hidden bg-canvas sm:h-96">
                        <img src={blog.image.url} alt={blog.title || "Blog cover"} className="h-full w-full object-cover" />
                        
                    </div>
                )}

                <div className="px-6 py-8 sm:px-12 sm:py-10 bg-white/50">
                    <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted">
                        <span className="badge">Blog post</span>
                        <span>{new Date(blog.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
                    </div>
                    <h1 className="max-w-3xl text-2xl font-black leading-tight tracking-tight text-ink sm:text-3xl">{blog.title}</h1>
                    <p className="mt-5 text-sm font-medium text-muted">
                        By <span className="text-ink">{blog?.author?.username || "Unknown author"}</span>
                    </p>

                    {isOwner && (
                        <div className="mt-7 flex justify-between items-center gap-2 border-t border-border pt-5">
                            <Link to={`/edit-blog/${blog._id}`} title="Edit this blog" aria-label="Edit blog" className="btn-icon-ghost rounded-lg text-muted! transition hover:bg-brand-subtle! hover:text-brand!">
                                <Pencil className="h-4 w-4" />
                            </Link>
                            <button type="button" aria-label="Delete blog" title="Delete this blog" onClick={() => setIsDeleteOpen(true)} className="btn-icon-ghost rounded-lg text-muted! transition hover:bg-danger-subtle! hover:text-danger!">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="prose mt-10 max-w-none whitespace-pre-wrap text-lg leading-8 text-ink-soft">
                        {blog?.description}
                    </div>

                    {deleteError && <p role="alert" className="mt-6 rounded-xl bg-danger-subtle px-4 py-3 text-sm text-danger">{deleteError}</p>}
                </div>
                <ConfirmDialog
                    open={isDeleteOpen}
                    title={deleteError ? "Delete failed" : "Delete blog"}
                    message={deleteDialogMessage}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => {
                        setIsDeleteOpen(false);
                        setDeleteError("");
                    }}
                    isProcessing={isDeleting}
                />
            </article>
    );
};

export default BlogDetail;