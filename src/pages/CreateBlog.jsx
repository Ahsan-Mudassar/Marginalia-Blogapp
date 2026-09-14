import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createBlog } from "../api/blogApi";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const CreateBlog = () => {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const [fieldErrors, setFieldErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        setFieldErrors((prev) => ({ ...prev, image: "" }));

        if (!file) {
            setImageFile(null);
            setPreviewUrl("");
            return;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            setFieldErrors((prev) => ({ ...prev, image: "Only JPG, PNG or WEBP images are allowed" }));
            e.target.value = "";
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            setFieldErrors((prev) => ({ ...prev, image: "Image must be under 5MB" }));
            e.target.value = "";
            return;
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const validate = () => {
        const errors = {};
        const trimmedTitle = title.trim();
        const trimmedContent = description.trim();

        if (!trimmedTitle) errors.title = "Title is required";
        else if (trimmedTitle.length < 3) errors.title = "Title must be at least 3 characters";

        if (!trimmedContent) errors.description = "Description is required";
        else if (trimmedContent.length < 20) errors.description = "Description must be at least 20 characters";

        if (!imageFile) errors.image = "Cover image is required";

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError("");

        if (isSubmitting) return;
        if (!validate()) return;

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("image", imageFile);

        setIsSubmitting(true);
        setUploadProgress(0);
        try {
            const { data } = await createBlog(formData, {
                onUploadProgress: (evt) => {
                    if (evt.total) setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
                },
            });

            navigate(`/blog/${data.data.blog._id}`, { replace: true });
        } catch (err) {
            if (!err.response) {
                setServerError("Network error — please check your internet connection.");
            } else if (err.response.status === 422) {
                setServerError("Image is too large for the server. Please choose a smaller file.");
            } else if (err.response.status === 415) {
                setServerError("Unsupported image format.");
            } else if (err.response.status === 400) {
                const validationErrors = err.response.data?.errors;
                const errorMessage = Array.isArray(validationErrors)
                    ? validationErrors.map((error) => error.msg || error.message).filter(Boolean).join(" ")
                    : typeof validationErrors === "object" && validationErrors
                        ? Object.values(validationErrors).join(" ")
                        : err.response.data?.message;

                setServerError(errorMessage || "Please check the details you entered.");
            } else if (err.response.status === 401) {
                setServerError("Your session has expired. Please log in again.");
            } else {
                setServerError("Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto my-5 max-w-5xl">
            <h1 className="my-2 text-2xl font-bold text-ink sm:text-3xl">Create New Post</h1>
            <p className="text-muted">Draft your ideas, create layouts, and publish instantly</p>
            {serverError && (
                <p role="alert" className="mt-3 rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger">
                    {serverError}
                </p>
            )}

            <form onSubmit={handleSubmit} noValidate encType="multipart/form-data" className="my-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                <div className="flex w-full flex-col gap-y-4">
                    <button type="submit"
                        className="btn-primary text-sm px-4 py-2 self-start"
                        disabled={isSubmitting}>
                        {isSubmitting ? "Publishing..." : "Publish Blog"}
                    </button>
                    <label htmlFor="title" className="field-label">Post Title</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        aria-invalid={!!fieldErrors.title}
                        className="input-field rounded-sm"
                        placeholder="Enter your post title"
                    />
                    {fieldErrors.title && <p role="alert" className="field-error-text">{fieldErrors.title}</p>}

                    <label htmlFor="description" className="field-label">Content</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={10}
                        className="input-field resize-y rounded-sm"
                        placeholder="Start writing here..."
                        aria-invalid={!!fieldErrors.description}
                    />
                    {fieldErrors.description && <p role="alert" className="field-error-text" >{fieldErrors.description}</p>}

                </div>
                <div className="card flex w-full flex-col gap-y-2 rounded-sm px-3 py-2 lg:w-80 lg:shrink-0 xl:w-96">
                    {previewUrl && <img src={previewUrl} alt="Cover preview" className="max-w-full h-auto rounded-sm" />}
                    <label htmlFor="image" className="field-label">Cover Image</label>
                    <input
                        id="image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="w-full border border-border rounded-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer bg-muted-2 hover:bg-muted text-white"
                    />
                    {fieldErrors.image && <p role="alert" className="field-error-text">{fieldErrors.image}</p>}

                    {isSubmitting && uploadProgress > 0 && <p className="text-sm text-muted">Uploading... {uploadProgress}%</p>}
                </div>
            </form>
        </div>
    );
};

export default CreateBlog;