import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      {/* Reviewer Info */}
      <div className="flex items-start gap-4 mb-4">
        <img
          src={review.reviewer.avatar}
          alt={`${review.reviewer.firstName} ${review.reviewer.lastName}`}
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">
                {review.reviewer.firstName} {review.reviewer.lastName}
              </h4>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review Text */}
      <p className="text-gray-700 mb-4">{review.comment}</p>

      {/* Aspects */}
      {review.aspects && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.entries(review.aspects).map(([aspect, rating]) => (
            <div key={aspect} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 capitalize">{aspect}:</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Would Recommend */}
      {review.wouldRecommend !== undefined && (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          review.wouldRecommend
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {review.wouldRecommend ? '👍 Recommends' : 'Does not recommend'}
        </div>
      )}
    </div>
  );
}