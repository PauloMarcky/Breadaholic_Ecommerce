import './Review.css'
import { useRef, useState, useEffect } from 'react'
import { socket } from '../../utils/socket.js';

export function Review() {
  const scrollRef = useRef(null);

  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);

  // 2. State to hold all the reviews from the database
  const [reviewsList, setReviewsList] = useState([]);

  useEffect(() => {
    // Define the fetcher inside to ensure it's treated as a side effect
    const loadInitialData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/get_feedbacks");
        const data = await response.json();
        if (response.ok) {
          setReviewsList(data); // This update is now safely 'async'
        }
      } catch (err) {
        console.error("Initial load failed:", err);
      }
    };

    loadInitialData();

    // Socket Listener (The "Subscription" part the error likes)
    const handleNewFeedback = (newReview) => {
      setReviewsList((prev) => [newReview, ...prev]);
    };

    socket.on('new_feedback_received', handleNewFeedback);

    return () => {
      socket.off('new_feedback_received', handleNewFeedback);
    };
  }, []); // Empty dependency array means this runs ONCE on mount

  const scrollEvent = ((direction) => {
    const { current } = scrollRef;
    const scrollAmount = 200;
    if (direction === 'left') {
      current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  });
  const handleAddFeedback = async () => {
    const userId = localStorage.getItem("currentUserId");

    if (!userId) {
      alert("Please log in to submit a review!");
      return;
    }
    if (!message.trim() || rating === 0) {
      alert("Please provide both a message and a star rating!");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/add_feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message: message,
          rating: rating
        }),
      });

      if (response.ok) {
        alert("Thank you for your feedback!");
        setMessage("");
        setRating(0);
      } else {
        const data = await response.json();
        alert("Failed to submit: " + data.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Server connection failed. Please try again later.");
    }
  };

  return (
    <>
      <div className="feedback-section">
        <h2 className="feedback-title">CUSTOMER FEEDBACK</h2>
        <p className="feedback-sub-title">PLEASE PROVIDE HONEST REVIEWS, AS THIS WILL HELP THE BUSINESS GROWTH</p>

        <div className="feedback-body">
          <button className="scroll-btn" onClick={() => scrollEvent('left')}>
            <img src="../public/left-arrow.png" alt="" />
          </button>

          <div className="reviews-grid" id="reviewsGrid" ref={scrollRef}>
            {reviewsList.length === 0 ? (
              <p className='message-no-review-yet'>No reviews yet. Add now!</p>
            ) : (
              reviewsList.map((review, index) => (
                <div className="review-card" key={index}>
                  <div className='user-feedback-flex'>
                    <img src={review.profile_picture} alt="" />
                    <h4 className='userName-display-review'>{review.first_name} {review.last_name}</h4>
                  </div>
                  <p>"{review.message}"</p>
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: i < review.rating ? "gold" : "lightgray" }}>★</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="scroll-btn" onClick={() => scrollEvent('right')}>
            <img src="../public/right-arrow.png" alt="" />
          </button>

          <div className="feedback-form">
            <textarea
              placeholder="Message here . . . ."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>

            <div className="star-rating">
              <input type="radio" id="star5" name="rating" value="5" checked={rating === 5} onChange={() => setRating(5)} />
              <label htmlFor="star5" title="5 stars">★</label>

              <input type="radio" id="star4" name="rating" value="4" checked={rating === 4} onChange={() => setRating(4)} />
              <label htmlFor="star4" title="4 stars">★</label>

              <input type="radio" id="star3" name="rating" value="3" checked={rating === 3} onChange={() => setRating(3)} />
              <label htmlFor="star3" title="3 stars">★</label>

              <input type="radio" id="star2" name="rating" value="2" checked={rating === 2} onChange={() => setRating(2)} />
              <label htmlFor="star2" title="2 stars">★</label>

              <input type="radio" id="star1" name="rating" value="1" checked={rating === 1} onChange={() => setRating(1)} />
              <label htmlFor="star1" title="1 star">★</label>
            </div>

            <button className="btn-submit" onClick={handleAddFeedback}>Submit Feedback</button>
          </div>
        </div>
      </div>
    </>
  )
}