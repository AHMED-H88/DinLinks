interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface ReviewListProps {
  reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className="text-gray-600">Ingen anmeldelser ennå</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
          <div className="flex items-start gap-4 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
              {review.authorName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">{review.authorName}</span>
                <div className="flex gap-1 text-amber-400 text-lg">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < review.rating ? "text-amber-400" : "text-gray-300"}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">{review.comment}</p>
              <p className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString('nb-NO')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
