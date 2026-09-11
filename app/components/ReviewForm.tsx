"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  rating: number;
  comment: string;
  customerName?: string;
  createdAt: string;
};

export default function ReviewForm({
  productId,
}: {
  productId: string;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    try {
      const response = await fetch(
        `/api/reviews?productId=${productId}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("REVIEW LOAD ERROR:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, item) => sum + item.rating, 0) /
        reviews.length
      : 0;

  const submitReview = async () => {
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    if (!comment.trim()) {
      alert("Please write a review.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          rating,
          comment: comment.trim(),
          customerName: "Customer",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Review could not be submitted"
        );
      }

      alert("Review submitted successfully! ⭐");

      setRating(0);
      setComment("");

      await loadReviews();
    } catch (error) {
      console.error("REVIEW SUBMIT ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Review could not be submitted."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 rounded-3xl border-2 border-gray-200 bg-white p-5 sm:p-7">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">

        <div>
          <h2 className="text-2xl font-black text-[#111827]">
            Ratings & Reviews
          </h2>

          <p className="mt-1 text-sm font-semibold text-gray-500">
            What customers think about this product
          </p>
        </div>

        <div className="text-right">

          <div className="text-xl font-black text-[#111827]">
            {averageRating > 0
              ? averageRating.toFixed(1)
              : "—"}{" "}
            ⭐
          </div>

          <p className="text-xs font-bold text-gray-500">
            {reviews.length}{" "}
            {reviews.length === 1 ? "review" : "reviews"}
          </p>

        </div>

      </div>


      {/* WRITE REVIEW */}
      <div className="mt-7 rounded-2xl border-2 border-gray-200 bg-gray-50 p-5">

        <h3 className="text-lg font-black text-[#111827]">
          Write a Review
        </h3>

        <p className="mt-1 text-sm font-semibold text-gray-500">
          How would you rate this product?
        </p>


        {/* STARS */}
        <div className="mt-4 flex gap-2">

          {[1, 2, 3, 4, 5].map((star) => (

            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-3xl transition-transform hover:scale-110 ${
                star <= rating
                  ? "text-yellow-400"
                  : "text-gray-300"
              }`}
            >
              ★
            </button>

          ))}

        </div>


        {/* COMMENT */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your review..."
          rows={4}
          className="mt-4 w-full resize-none rounded-xl border-2 border-gray-300 bg-white p-4 font-semibold text-gray-900 outline-none focus:border-[#172554]"
        />


        {/* SUBMIT */}
        <button
          type="button"
          onClick={submitReview}
          disabled={submitting}
          className="mt-4 rounded-xl bg-[#172554] px-6 py-3 font-black text-white hover:bg-[#0f1b3d] disabled:bg-gray-400"
        >
          {submitting
            ? "Submitting..."
            : "Submit Review ⭐"}
        </button>

      </div>


      {/* REVIEWS */}
      <div className="mt-7">

        {loading ? (

          <p className="py-8 text-center font-bold text-gray-500">
            Loading reviews...
          </p>

        ) : reviews.length === 0 ? (

          <div className="py-8 text-center">

            <div className="text-5xl">
              ⭐
            </div>

            <h3 className="mt-3 text-lg font-black text-gray-900">
              No reviews yet
            </h3>

            <p className="mt-1 text-sm font-semibold text-gray-500">
              Be the first customer to review this product.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {reviews.map((review) => (

              <div
                key={review.id}
                className="rounded-2xl border-2 border-gray-200 bg-white p-4"
              >

                <div className="flex items-center justify-between gap-3">

                  <p className="font-black text-gray-900">
                    {review.customerName || "Customer"}
                  </p>

                  <div className="text-yellow-400">
                    {"★".repeat(review.rating)}
                    <span className="text-gray-300">
                      {"★".repeat(5 - review.rating)}
                    </span>
                  </div>

                </div>

                <p className="mt-2 font-semibold text-gray-700">
                  {review.comment}
                </p>

                <p className="mt-2 text-xs font-bold text-gray-400">
                  {new Date(
                    review.createdAt
                  ).toLocaleDateString("en-IN")}
                </p>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}