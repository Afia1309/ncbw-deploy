import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

export default function CourseSelection() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/training/dashboard/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data.required_modules);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getProgressValue = (status) => {
    switch(status) {
      case 'completed': return 100;
      case 'in_progress': return 50;
      default: return 0;
    }
  };

  const allComplete = courses.every(c => c.status === 'completed');

  if (loading) {
    return (
      <MemberLayout title="Courses">
        <div className="dash-loading">Loading courses...</div>
      </MemberLayout>
    );
  }

  if (error) {
    return (
      <MemberLayout title="Courses">
        <div className="dash-error">{error}</div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout title="Courses">
      <div className="course-list">
        {courses.map((course) => {
          const progress = getProgressValue(course.status);
          return (
            <div key={course.id} className="course-item">
              <div className="course-header-row">
                <div className="course-title">{course.title}</div>
                {course.required && (
                  <span className="dash-required-badge">Required</span>
                )}
                {course.locked && (
                  <span className="dash-locked-badge">🔒 Locked</span>
                )}
              </div>

              <div className="course-description">
                {course.title} - {course.status.replace('_', ' ')}
              </div>

              <div className="course-meta">
                <span>{progress}% Complete</span>
                <div className="course-progress-bar">
                  <div
                    className="course-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button
                  className="course-view-btn"
                  type="button"
                  onClick={() => navigate(`/member/course/${course.id}`)}
                  disabled={course.locked}
                >
                  {course.locked ? 'Locked' : 'View Course'}
                </button>
              </div>
            </div>
          );
        })}

        <div className="course-certificate-banner">
          {allComplete
            ? "🎉 All courses complete! View your certificate."
            : "Complete all courses to view your certificate."}
        </div>
      </div>
    </MemberLayout>
  );
}