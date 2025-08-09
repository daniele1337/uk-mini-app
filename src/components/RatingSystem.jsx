import React, { useState } from 'react'
import { Star, Send } from 'lucide-react'

const RatingSystem = () => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('https://24autoflow.ru/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment
        })
      })

      if (response.ok) {
        setSubmitted(true)
        setRating(0)
        setComment('')
      }
    } catch (error) {
      console.log('Error submitting rating:', error)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Спасибо за отзыв!
          </h3>
          <p className="text-gray-600 mb-4">
            Ваш отзыв поможет нам стать лучше
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-blue-600 hover:text-blue-800"
          >
            Оставить еще один отзыв
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Star className="w-5 h-5 mr-2" />
          Оцените наш сервис
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Ваша оценка
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-2 rounded-lg transition-colors ${
                  star <= rating
                    ? 'text-yellow-400 hover:text-yellow-500'
                    : 'text-gray-300 hover:text-gray-400'
                }`}
              >
                <Star className="w-8 h-8 fill-current" />
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {rating === 0 && 'Выберите оценку'}
            {rating === 1 && 'Очень плохо'}
            {rating === 2 && 'Плохо'}
            {rating === 3 && 'Удовлетворительно'}
            {rating === 4 && 'Хорошо'}
            {rating === 5 && 'Отлично'}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Комментарий (необязательно)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Расскажите о вашем опыте..."
          />
        </div>

        <button
          type="submit"
          disabled={rating === 0}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4 mr-2" />
          Отправить отзыв
        </button>
      </form>
    </div>
  )
}

export default RatingSystem
