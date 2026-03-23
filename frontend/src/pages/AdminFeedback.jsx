import React, { useMemo } from "react";
import AdminLayout from "../../components/AdminLayout";

const feedbackItems = [
  {
    id: 1,
    name: "John Doe",
    role: "President",
    course: "Leadership & Strategic Visioning",
    rating: 5,
    comment:
      "Great course content, very comprehensive and helpful for daily leadership decisions.",
    timeAgo: "2 hours ago",
  },
  {
    id: 2,
    name: "Jane Smith",
    role: "Treasurer",
    course: "Nonprofit Financial Management",
    rating: 4,
    comment:
      "Would like to see more video examples and practical scenarios, but overall very useful.",
    timeAgo: "5 hours ago",
  },
  {
    id: 3,
    name: "Mike Johnson",
    role: "Vice President",
    course: "Project Management Essentials",
    rating: 5,
    comment:
      "Excellent course. The material was organized clearly and easy to follow.",
    timeAgo: "1 day ago",
  },
  {
    id: 4,
    name: "Sarah Williams",
    role: "Corresponding Secretary",
    course: "Professional Writing & Email Etiquette",
    rating: 4,
    comment:
      "Good course overall, but some sections felt a little rushed near the end.",
    timeAgo: "2 days ago",
  },
  {
    id: 5,
    name: "Robert Brown",
    role: "Chaplain",
    course: "Conflict Resolution",
    rating: 5,
    comment:
      "Very practical and relevant. I can immediately apply several of these concepts.",
    timeAgo: "3 days ago",
  },
  {
    id: 6,
    name: "Linda Davis",
    role: "Financial Secretary",
    course: "Delegation & Time Management",
    rating: 3,
    comment:
      "Helpful content, but I think the pacing could be improved in the middle modules.",
    timeAgo: "4 days ago",
  },
  {
    id: 7,
    name: "Angela Moore",
    role: "Member at Large",
    course: "Organizational Culture",
    rating: 5,
    comment:
      "Loved the examples and how everything was tied back to real organizational leadership.",
    timeAgo: "5 days ago",
  },
  {
    id: 8,
    name: "David Clark",
    role: "Recording Secretary",
    course: "Effective Public Speaking",
    rating: 4,
    comment:
      "Strong course with useful tips. More downloadable resources would make it even better.",
    timeAgo: "6 days ago",
  },
  {
    id: 9,
    name: "Patricia Lewis",
    role: "Assistant Treasurer",
    course: "Servant Leadership",
    rating: 5,
    comment:
      "One of my favorite courses so far. The message was clear and encouraging.",
    timeAgo: "1 week ago",
  },
  {
    id: 10,
    name: "Christopher Hall",
    role: "Parliamentarian",
    course: "Meeting Leadership Essentials",
    rating: 4,
    comment:
      "Good information and structure. I would like a few more advanced case studies.",
    timeAgo: "1 week ago",
  },
  {
    id: 11,
    name: "Barbara Allen",
    role: "First Vice President",
    course: "Team Communication",
    rating: 5,
    comment:
      "The activities made this course very engaging. Strong material throughout.",
    timeAgo: "1 week ago",
  },
  {
    id: 12,
    name: "Thomas Young",
    role: "Second Vice President",
    course: "Leadership Foundations",
    rating: 4,
    comment:
      "Clear, useful, and well put together. Great entry point for newer members.",
    timeAgo: "1 week ago",
  },
];

function StarRating({ rating }) {
  return (
    <div className="admin-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`admin-star ${star <= rating ? "filled" : ""}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function AdminFeedback() {
  const totalFeedback = feedbackItems.length;

  const averageRating = useMemo(() => {
    const total = feedbackItems.reduce((sum, item) => sum + item.rating, 0);
    return (total / feedbackItems.length).toFixed(1);
  }, []);

  const breakdown = useMemo(() => {
    return [5, 4, 3, 2, 1].map((rating) => {
      const count = feedbackItems.filter((item) => item.rating === rating).length;
      const percentage = totalFeedback ? (count / totalFeedback) * 100 : 0;

      return {
        rating,
        count,
        percentage,
      };
    });
  }, [totalFeedback]);

  return (
    <AdminLayout title="Course Feedback">
      <div className="admin-feedback-layout">
        <div className="admin-feedback-sidebar">
          <section className="dash-card admin-feedback-summary-card">
            <h2 className="dash-section-title">Feedback Overview</h2>

            <div className="admin-stat-stack">
              <div className="admin-mini-stat-card">
                <div className="admin-mini-stat-label">Total Feedback</div>
                <div className="admin-mini-stat-value">{totalFeedback}</div>
              </div>

              <div className="admin-mini-stat-card">
                <div className="admin-mini-stat-label">Average Rating</div>
                <div className="admin-mini-stat-value">
                  {averageRating}
                  <span className="admin-mini-stars-inline">★★★★★</span>
                </div>
              </div>
            </div>
          </section>

          <section className="dash-card admin-feedback-breakdown-card">
            <h2 className="dash-section-title">Rating Breakdown</h2>

            <div className="admin-rating-breakdown-list">
              {breakdown.map((item) => (
                <div key={item.rating} className="admin-rating-row">
                  <div className="admin-rating-label">
                    <span>{item.rating}</span>
                    <span className="admin-rating-star-symbol">★</span>
                  </div>

                  <div className="admin-rating-track">
                    <div
                      className="admin-rating-fill"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  <div className="admin-rating-count">{item.count}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="admin-feedback-list">
          {feedbackItems.map((item) => (
            <article key={item.id} className="dash-card admin-feedback-item">
              <div className="admin-feedback-item-top">
                <div className="admin-feedback-person">
                  <div className="admin-feedback-person-name-row">
                    <h3 className="admin-feedback-name">{item.name}</h3>
                    <span className="admin-feedback-dot">•</span>
                    <span className="admin-feedback-role">{item.role}</span>
                  </div>

                  <div className="admin-feedback-course">{item.course}</div>
                </div>

                <div className="admin-feedback-meta">
                  <StarRating rating={item.rating} />
                  <div className="admin-feedback-time">{item.timeAgo}</div>
                </div>
              </div>

              <p className="admin-feedback-comment">{item.comment}</p>
            </article>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
