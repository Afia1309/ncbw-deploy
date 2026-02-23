import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

export default function CourseMaterial() {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModuleDetails();
  }, [materialId]);

  const fetchModuleDetails = async () => {
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

      const data = await response.json();
      const foundModule = data.required_modules.find(m => m.id === parseInt(materialId));
      setModule(foundModule);
    } catch (err) {
      console.error('Failed to fetch module:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateModuleStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:8000/api/training/modules/${materialId}/status/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      // Refresh module data
      fetchModuleDetails();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading || !module) {
    return (
      <MemberLayout title="Loading...">
        <div className="dash-loading">Loading course material...</div>
      </MemberLayout>
    );
  }

  const isLocked = module.locked;
  const isComplete = module.status === 'completed';
  const isInProgress = module.status === 'in_progress';

  return (
    <MemberLayout title={module.title}>
      <div className="course-material-grid">
        <aside className="material-sidebar">
          <div className="material-sidebar-title">Course Information</div>
          <div className="sidebar-section-item">
            <span>Status</span>
            <span className={`dash-status-badge ${module.status}`}>
              {module.status.replace('_', ' ')}
            </span>
          </div>
          <div className="sidebar-section-item">
            <span>Required</span>
            <span>{module.required ? 'Yes' : 'No'}</span>
          </div>
          {module.due_date && (
            <div className="sidebar-section-item">
              <span>Due Date</span>
              <span>{new Date(module.due_date).toLocaleDateString()}</span>
            </div>
          )}
        </aside>

        <div className="material-main">
          <div className="material-video">
            <div className="material-video-placeholder">
              <div className="material-video-icon">▶</div>
              <div>Video: {module.title}</div>
            </div>
          </div>

          <div className="material-actions">
            {!isLocked && !isComplete && (
              <button
                className="primary-btn"
                onClick={() => updateModuleStatus(
                  isInProgress ? 'completed' : 'in_progress'
                )}
              >
                {isInProgress ? 'Mark Complete' : 'Start Module'}
              </button>
            )}
            {isComplete && (
              <button className="secondary-btn" disabled>
                ✓ Completed
              </button>
            )}
            {isLocked && (
              <button className="secondary-btn" disabled>
                🔒 Locked
              </button>
            )}
          </div>

          <div className="material-description">
            <h3>About this course</h3>
            <p>
              This module covers essential concepts in {module.title}. 
              Complete the required activities to master this topic.
            </p>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}