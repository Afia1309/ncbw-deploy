import { useMemo, useState } from "react";
import InstructorLayout from "../components/InstructorLayout";
import "./InstructorCourseDetail.css";

const students = [
  {
    id: 1,
    name: "Ava Johnson",
    memberId: "N10024567",
    role: "President",
    progress: 85,
    status: "In Progress",
    enrollmentDate: "2026-01-12",
  },
  {
    id: 2,
    name: "Nia Thompson",
    memberId: "N10024568",
    role: "Vice President",
    progress: 100,
    status: "Completed",
    enrollmentDate: "2026-01-18",
  },
  {
    id: 3,
    name: "Maya Carter",
    memberId: "N10024569",
    role: "General Member",
    progress: 42,
    status: "In Progress",
    enrollmentDate: "2026-02-03",
  },
];

const roleOptions = [
  "President",
  "Vice President",
  "Treasurer",
  "Secretary",
  "Chaplain",
  "Parliamentarian",
  "General Member",
];

const nowIso = () => new Date().toISOString();

const createBlankQuestion = () => ({
  id: Date.now() + Math.random(),
  prompt: "",
  points: 1,
  options: [
    { id: Date.now() + Math.random() + 1, text: "" },
    { id: Date.now() + Math.random() + 2, text: "" },
    { id: Date.now() + Math.random() + 3, text: "" },
    { id: Date.now() + Math.random() + 4, text: "" },
  ],
  correctOptionId: null,
});

const initialModules = [
  {
    id: 1,
    title: "Module 1: Welcome and Orientation",
    visible: true,
    isExpanded: true,
    createdAt: "2026-03-20T10:00:00.000Z",
    items: [
      {
        id: 1,
        type: "PDF",
        title: "Program Handbook",
        visible: true,
        createdAt: "2026-03-20T10:20:00.000Z",
        fileName: "program-handbook.pdf",
      },
      {
        id: 2,
        type: "External Video",
        title: "Welcome Video Link",
        visible: true,
        createdAt: "2026-03-20T11:00:00.000Z",
        externalUrl: "https://example.com/welcome-video",
      },
    ],
  },
  {
    id: 2,
    title: "Module 2: Leadership Foundations",
    visible: false,
    isExpanded: false,
    createdAt: "2026-03-24T09:30:00.000Z",
    items: [
      {
        id: 3,
        type: "Quiz",
        title: "Leadership Foundations Quiz",
        visible: false,
        createdAt: "2026-03-24T10:00:00.000Z",
        audienceType: "role",
        audienceRoles: ["Vice President"],
        quiz: {
          autoGrade: true,
          passingGrade: 70,
          questions: [
            {
              id: 1,
              prompt: "Which quality is most important in servant leadership?",
              points: 5,
              options: [
                { id: 1, text: "Control" },
                { id: 2, text: "Listening" },
                { id: 3, text: "Status" },
                { id: 4, text: "Titles" },
              ],
              correctOptionId: 2,
            },
          ],
          totalPoints: 5,
        },
      },
    ],
  },
];

export default function InstructorCourseDetail() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [courseStatus, setCourseStatus] = useState("Draft");

  const [selectedRoles, setSelectedRoles] = useState([
    "President",
    "Vice President",
    "Treasurer",
    "Secretary",
    "Chaplain",
    "Parliamentarian",
  ]);
  const [memberIdInput, setMemberIdInput] = useState("");
  const [assignedMemberIds, setAssignedMemberIds] = useState(["N10024567", "N10024592"]);
  const [isVisibilitySaved, setIsVisibilitySaved] = useState(false);

  const [modules, setModules] = useState(initialModules);

  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleVisible, setNewModuleVisible] = useState(true);

  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemType, setNewItemType] = useState("PDF");
  const [newItemVisible, setNewItemVisible] = useState(true);

  const [newItemAudienceType, setNewItemAudienceType] = useState("all");
  const [newItemAudienceRoles, setNewItemAudienceRoles] = useState([]);
  const [newItemAudienceMemberIdInput, setNewItemAudienceMemberIdInput] = useState("");
  const [newItemAudienceMemberIds, setNewItemAudienceMemberIds] = useState([]);

  const [newItemFile, setNewItemFile] = useState(null);
  const [newItemExternalUrl, setNewItemExternalUrl] = useState("");
  const [newItemLinkUrl, setNewItemLinkUrl] = useState("");
  const [newItemTextContent, setNewItemTextContent] = useState("");

  const [quizQuestions, setQuizQuestions] = useState([createBlankQuestion()]);
  const [quizPassingGrade, setQuizPassingGrade] = useState(70);

  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [enrollmentSort, setEnrollmentSort] = useState("default");

  const [contentSearch, setContentSearch] = useState("");
  const [contentSort, setContentSort] = useState("module-order");

  const enrollmentCount = students.length;

  const filteredStudents = useMemo(() => {
    const value = enrollmentSearch.trim().toLowerCase();

    let result = [...students];

    if (value) {
      result = result.filter((student) => {
        return (
          student.name.toLowerCase().includes(value) ||
          student.memberId.toLowerCase().includes(value) ||
          student.role.toLowerCase().includes(value) ||
          student.status.toLowerCase().includes(value) ||
          student.enrollmentDate.toLowerCase().includes(value)
        );
      });
    }

    if (enrollmentSort === "date-newest") {
      result.sort(
        (a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime()
      );
    }

    if (enrollmentSort === "date-oldest") {
      result.sort(
        (a, b) => new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime()
      );
    }

    return result;
  }, [enrollmentSearch, enrollmentSort]);

  const filteredAndSortedModules = useMemo(() => {
    let result = [...modules];

    const search = contentSearch.trim().toLowerCase();

    if (search) {
      result = result.filter((module) => {
        const moduleMatch = module.title.toLowerCase().includes(search);

        const itemMatch = module.items.some((item) => {
          const detailText = [
            item.title,
            item.type,
            item.fileName,
            item.externalUrl,
            item.linkUrl,
            item.textContent,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return detailText.includes(search);
        });

        return moduleMatch || itemMatch;
      });
    }

    if (contentSort === "recently-added") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (contentSort === "module-name-asc") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (contentSort === "module-name-desc") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    }

    return result;
  }, [modules, contentSearch, contentSort]);

  const toggleRole = (role) => {
    if (isVisibilitySaved) return;

    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
    );
  };

  const handleAddMemberId = () => {
    if (isVisibilitySaved) return;

    const parsedIds = memberIdInput
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (parsedIds.length === 0) return;

    setAssignedMemberIds((prev) => {
      const merged = [...prev];
      parsedIds.forEach((id) => {
        if (!merged.includes(id)) merged.push(id);
      });
      return merged;
    });

    setMemberIdInput("");
  };

  const removeMemberId = (idToRemove) => {
    if (isVisibilitySaved) return;
    setAssignedMemberIds((prev) => prev.filter((id) => id !== idToRemove));
  };

  const handleSaveVisibility = () => {
    setIsVisibilitySaved(true);
  };

  const handleEditVisibility = () => {
    setIsVisibilitySaved(false);
  };

  const handleCreateModule = () => {
    const trimmed = newModuleTitle.trim();
    if (!trimmed) return;

    const newModule = {
      id: Date.now(),
      title: trimmed,
      visible: newModuleVisible,
      isExpanded: true,
      createdAt: nowIso(),
      items: [],
    };

    setModules((prev) => [...prev, newModule]);
    setNewModuleTitle("");
    setNewModuleVisible(true);
    setShowAddModuleModal(false);
  };

  const startEditingModuleTitle = (module) => {
    setEditingModuleId(module.id);
    setEditingModuleTitle(module.title);
  };

  const saveModuleTitle = (moduleId) => {
    const trimmed = editingModuleTitle.trim();
    if (!trimmed) return;

    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId ? { ...module, title: trimmed } : module
      )
    );

    setEditingModuleId(null);
    setEditingModuleTitle("");
  };

  const cancelModuleTitleEdit = () => {
    setEditingModuleId(null);
    setEditingModuleTitle("");
  };

  const toggleModuleExpanded = (moduleId) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? { ...module, isExpanded: !module.isExpanded }
          : module
      )
    );
  };

  const toggleModuleVisibility = (moduleId) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId ? { ...module, visible: !module.visible } : module
      )
    );
  };

  const toggleItemVisibility = (moduleId, itemId) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              items: module.items.map((item) =>
                item.id === itemId ? { ...item, visible: !item.visible } : item
              ),
            }
          : module
      )
    );
  };

  const openAddItemModal = (moduleId) => {
    setSelectedModuleId(moduleId);
    resetNewItemForm();
    setShowAddItemModal(true);
  };

  const resetNewItemForm = () => {
    setNewItemTitle("");
    setNewItemType("PDF");
    setNewItemVisible(true);

    setNewItemAudienceType("all");
    setNewItemAudienceRoles([]);
    setNewItemAudienceMemberIdInput("");
    setNewItemAudienceMemberIds([]);

    setNewItemFile(null);
    setNewItemExternalUrl("");
    setNewItemLinkUrl("");
    setNewItemTextContent("");

    setQuizQuestions([createBlankQuestion()]);
    setQuizPassingGrade(70);
  };

  const toggleNewItemRole = (role) => {
    setNewItemAudienceRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
    );
  };

  const addNewItemMemberIds = () => {
    const parsedIds = newItemAudienceMemberIdInput
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (parsedIds.length === 0) return;

    setNewItemAudienceMemberIds((prev) => {
      const merged = [...prev];
      parsedIds.forEach((id) => {
        if (!merged.includes(id)) merged.push(id);
      });
      return merged;
    });

    setNewItemAudienceMemberIdInput("");
  };

  const removeNewItemMemberId = (idToRemove) => {
    setNewItemAudienceMemberIds((prev) => prev.filter((id) => id !== idToRemove));
  };

  const calculateQuizTotalPoints = (questions) => {
    return questions.reduce((sum, question) => sum + Number(question.points || 0), 0);
  };

  const handleCreateItem = () => {
    const trimmedTitle = newItemTitle.trim();
    if (!trimmedTitle || !selectedModuleId) return;

    if (newItemAudienceType === "role" && newItemAudienceRoles.length === 0) return;
    if (newItemAudienceType === "member" && newItemAudienceMemberIds.length === 0) return;

    const newItem = {
      id: Date.now(),
      type: newItemType,
      title: trimmedTitle,
      visible: newItemVisible,
      createdAt: nowIso(),
      audienceType: newItemAudienceType,
      audienceRoles: newItemAudienceRoles,
      audienceMemberIds: newItemAudienceMemberIds,
    };

    if (newItemType === "PDF") {
      newItem.fileName = newItemFile ? newItemFile.name : "";
    }

    if (newItemType === "External Video") {
      if (!newItemExternalUrl.trim()) return;
      newItem.externalUrl = newItemExternalUrl.trim();
    }

    if (newItemType === "Link") {
      if (!newItemLinkUrl.trim()) return;
      newItem.linkUrl = newItemLinkUrl.trim();
    }

    if (newItemType === "Text Content") {
      if (!newItemTextContent.trim()) return;
      newItem.textContent = newItemTextContent.trim();
    }

    if (newItemType === "Quiz") {
      const cleanedQuestions = quizQuestions
        .map((question) => ({
          ...question,
          prompt: question.prompt.trim(),
          points: Number(question.points || 0),
          options: question.options.map((option) => ({
            ...option,
            text: option.text.trim(),
          })),
        }))
        .filter((question) => {
          const filledOptions = question.options.filter((option) => option.text);
          return (
            question.prompt &&
            filledOptions.length >= 2 &&
            question.correctOptionId &&
            question.points > 0
          );
        });

      if (cleanedQuestions.length === 0) return;

      newItem.quiz = {
        autoGrade: true,
        passingGrade: Number(quizPassingGrade || 0),
        questions: cleanedQuestions,
        totalPoints: calculateQuizTotalPoints(cleanedQuestions),
      };
    }

    setModules((prev) =>
      prev.map((module) =>
        module.id === selectedModuleId
          ? {
              ...module,
              isExpanded: true,
              items: [...module.items, newItem],
            }
          : module
      )
    );

    setSelectedModuleId(null);
    setShowAddItemModal(false);
    resetNewItemForm();
  };

  const addQuizQuestion = () => {
    setQuizQuestions((prev) => [...prev, createBlankQuestion()]);
  };

  const removeQuizQuestion = (questionId) => {
    setQuizQuestions((prev) => prev.filter((question) => question.id !== questionId));
  };

  const updateQuizQuestionPrompt = (questionId, value) => {
    setQuizQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? { ...question, prompt: value } : question
      )
    );
  };

  const updateQuizQuestionPoints = (questionId, value) => {
    setQuizQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? { ...question, points: value === "" ? "" : Number(value) }
          : question
      )
    );
  };

  const updateQuizOptionText = (questionId, optionId, value) => {
    setQuizQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option) =>
                option.id === optionId ? { ...option, text: value } : option
              ),
            }
          : question
      )
    );
  };

  const setQuizCorrectAnswer = (questionId, optionId) => {
    setQuizQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? { ...question, correctOptionId: optionId }
          : question
      )
    );
  };

  const renderTypeSpecificFields = () => {
    if (newItemType === "PDF") {
      return (
        <div className="modal-field">
          <label>Upload PDF</label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setNewItemFile(e.target.files?.[0] || null)}
            className="file-input"
          />
          {newItemFile && <p className="field-helper">Selected file: {newItemFile.name}</p>}
        </div>
      );
    }

    if (newItemType === "External Video") {
      return (
        <div className="modal-field">
          <label>Video URL</label>
          <input
            type="url"
            value={newItemExternalUrl}
            onChange={(e) => setNewItemExternalUrl(e.target.value)}
            placeholder="Paste external video link"
          />
        </div>
      );
    }

    if (newItemType === "Link") {
      return (
        <div className="modal-field">
          <label>Link URL</label>
          <input
            type="url"
            value={newItemLinkUrl}
            onChange={(e) => setNewItemLinkUrl(e.target.value)}
            placeholder="Paste link"
          />
        </div>
      );
    }

    if (newItemType === "Text Content") {
      return (
        <div className="modal-field">
          <label>Text Content</label>
          <textarea
            value={newItemTextContent}
            onChange={(e) => setNewItemTextContent(e.target.value)}
            placeholder="Enter the text students should read"
            rows={6}
          />
        </div>
      );
    }

    if (newItemType === "Quiz") {
      const totalPoints = calculateQuizTotalPoints(
        quizQuestions.map((q) => ({
          ...q,
          points: Number(q.points || 0),
        }))
      );

      return (
        <div className="quiz-builder">
          <div className="quiz-builder-header">
            <div>
              <h3>Quiz Builder</h3>
              <p>
                Add questions, set the correct answers, assign points to each question,
                and define the passing grade.
              </p>
            </div>

            <button
              type="button"
              className="outline-btn small-outline-btn"
              onClick={addQuizQuestion}
            >
              + Add Question
            </button>
          </div>

          <div className="quiz-settings-row">
            <div className="modal-field">
              <label>Passing Grade (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={quizPassingGrade}
                onChange={(e) => setQuizPassingGrade(e.target.value)}
                placeholder="70"
              />
            </div>

            <div className="quiz-total-points-box">
              <span className="quiz-total-points-label">Total Quiz Points</span>
              <span className="quiz-total-points-value">{totalPoints}</span>
            </div>
          </div>

          {quizQuestions.map((question, index) => (
            <div key={question.id} className="quiz-question-card">
              <div className="quiz-question-top">
                <h4>Question {index + 1}</h4>

                {quizQuestions.length > 1 && (
                  <button
                    type="button"
                    className="text-btn danger-text-btn"
                    onClick={() => removeQuizQuestion(question.id)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="modal-field">
                <label>Question Prompt</label>
                <textarea
                  value={question.prompt}
                  onChange={(e) => updateQuizQuestionPrompt(question.id, e.target.value)}
                  placeholder="Enter the question"
                  rows={3}
                />
              </div>

              <div className="question-points-row">
                <div className="modal-field">
                  <label>Point Value</label>
                  <input
                    type="number"
                    min="1"
                    value={question.points}
                    onChange={(e) => updateQuizQuestionPoints(question.id, e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="quiz-options-grid">
                {question.options.map((option, optionIndex) => (
                  <div key={option.id} className="quiz-option-row">
                    <div className="quiz-option-input-wrap">
                      <span className="quiz-option-letter">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>

                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) =>
                          updateQuizOptionText(question.id, option.id, e.target.value)
                        }
                        placeholder={`Answer option ${optionIndex + 1}`}
                      />
                    </div>

                    <label className="correct-answer-select">
                      <input
                        type="radio"
                        name={`correct-answer-${question.id}`}
                        checked={question.correctOptionId === option.id}
                        onChange={() => setQuizCorrectAnswer(question.id, option.id)}
                      />
                      <span>Correct answer</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="quiz-autograde-note">
            Auto-grading enabled. Correct answers remain instructor-only.
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <InstructorLayout
      breadcrumbs={[
        { label: "My Courses", path: "/instructor/courses" },
        { label: "Leadership Training 101", path: "/instructor/courses/1" },
        { label: activeTab, path: "#" },
      ]}
    >
      <div className="course-detail-page">
        <div className="course-detail-header">
          <div>
            <h1>Leadership Training 101</h1>
          </div>

          {activeTab === "Content" && (
            <button className="gold-action-btn" onClick={() => setShowAddModuleModal(true)}>
              + Add Content
            </button>
          )}
        </div>

        <div className="course-tabs">
          {["Overview", "Content", "Enrollment"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "course-tab active" : "course-tab"}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <>
            <div className="detail-card">
              <h2>Course Overview</h2>

              <div className="overview-grid overview-grid-two">
                <div className="overview-box">
                  <span className="overview-label">Enrollment Count</span>
                  <p>{enrollmentCount} members</p>
                </div>

                <button
                  type="button"
                  className={`overview-box status-flip-card ${
                    courseStatus === "Published" ? "published" : "draft"
                  }`}
                  onClick={() =>
                    setCourseStatus((prev) => (prev === "Published" ? "Draft" : "Published"))
                  }
                >
                  <span className="overview-label">Course Status</span>
                  <div className="status-flip-content">
                    <span className="status-big">{courseStatus}</span>
                    <span className="status-helper">
                      Click to switch to {courseStatus === "Published" ? "Draft" : "Published"}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className={`detail-card visibility-card ${isVisibilitySaved ? "saved" : ""}`}>
              <div className="visibility-header">
                <div>
                  <h2>Visibility & Assignment</h2>
                  <p className="section-helper-text">
                    Control who can see this course by leadership position or by specific member ID.
                  </p>
                </div>

                {isVisibilitySaved ? (
                  <button className="outline-btn" onClick={handleEditVisibility}>
                    Edit Visibility
                  </button>
                ) : (
                  <button className="outline-btn" onClick={handleSaveVisibility}>
                    Save Visibility
                  </button>
                )}
              </div>

              {isVisibilitySaved && (
                <div className="saved-banner">
                  Visibility settings saved. Click Edit Visibility to make changes.
                </div>
              )}

              <div className="visibility-section">
                <h3>Assign by Position</h3>

                <div className="position-grid">
                  {roleOptions.map((role) => {
                    const checked = selectedRoles.includes(role);

                    return (
                      <label
                        key={role}
                        className={[
                          "position-option",
                          checked ? "checked" : "",
                          isVisibilitySaved ? "disabled" : "",
                        ]
                          .join(" ")
                          .trim()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRole(role)}
                          disabled={isVisibilitySaved}
                        />
                        <span className="custom-checkbox" />
                        <span className="position-label">{role}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="visibility-section">
                <h3>Assign by Member ID</h3>

                <div className="member-id-entry">
                  <input
                    type="text"
                    value={memberIdInput}
                    onChange={(e) => setMemberIdInput(e.target.value)}
                    placeholder="Enter one or more member IDs separated by commas"
                    className="member-id-input"
                    disabled={isVisibilitySaved}
                  />
                  <button
                    type="button"
                    className="gold-action-btn small"
                    onClick={handleAddMemberId}
                    disabled={isVisibilitySaved}
                  >
                    Add
                  </button>
                </div>

                <div className="member-id-tags">
                  {assignedMemberIds.map((id) => (
                    <span
                      key={id}
                      className={isVisibilitySaved ? "member-id-pill disabled" : "member-id-pill"}
                    >
                      {id}
                      <button
                        type="button"
                        onClick={() => removeMemberId(id)}
                        disabled={isVisibilitySaved}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "Content" && (
          <>
            <div className="detail-card content-controls-card">
              <div className="content-controls">
                <input
                  type="text"
                  className="content-search"
                  placeholder="Search modules or items"
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                />

                <select
                  className="content-sort"
                  value={contentSort}
                  onChange={(e) => setContentSort(e.target.value)}
                >
                  <option value="module-order">Default Order</option>
                  <option value="recently-added">Recently Added</option>
                  <option value="module-name-asc">Module Name A–Z</option>
                  <option value="module-name-desc">Module Name Z–A</option>
                </select>
              </div>
            </div>

            <div className="content-stack">
              {filteredAndSortedModules.map((module) => (
                <div key={module.id} className="detail-card module-card">
                  <div className="module-header">
                    <div className="module-title-wrap">
                      <div className="module-title-row">
                        <button
                          type="button"
                          className="accordion-toggle"
                          onClick={() => toggleModuleExpanded(module.id)}
                          aria-label={module.isExpanded ? "Collapse module" : "Expand module"}
                          title={module.isExpanded ? "Collapse module" : "Expand module"}
                        >
                          <span className={`accordion-arrow ${module.isExpanded ? "open" : ""}`}>
                            ⌃
                          </span>
                        </button>

                        {editingModuleId === module.id ? (
                          <div className="module-title-edit-row">
                            <input
                              type="text"
                              value={editingModuleTitle}
                              onChange={(e) => setEditingModuleTitle(e.target.value)}
                              className="module-title-edit-input"
                              autoFocus
                            />
                            <button
                              type="button"
                              className="text-btn"
                              onClick={() => saveModuleTitle(module.id)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="text-btn muted-text-btn"
                              onClick={cancelModuleTitleEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <h2>{module.title}</h2>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => startEditingModuleTitle(module)}
                              title="Edit module name"
                              aria-label="Edit module name"
                            >
                              ✎
                            </button>
                          </>
                        )}
                      </div>

                      <div className="module-visibility-row">
                        <span
                          className={
                            module.visible
                              ? "module-status-pill visible"
                              : "module-status-pill hidden"
                          }
                        >
                          {module.visible ? "Visible to students" : "Hidden from students"}
                        </span>

                        <button
                          className="outline-btn small-outline-btn"
                          onClick={() => toggleModuleVisibility(module.id)}
                        >
                          {module.visible ? "Hide Module" : "Show Module"}
                        </button>
                      </div>
                    </div>

                    <button className="outline-btn" onClick={() => openAddItemModal(module.id)}>
                      + Add Item
                    </button>
                  </div>

                  {module.isExpanded && (
                    <div className="content-item-list">
                      {module.items.length === 0 ? (
                        <div className="empty-module-state">No items yet in this module.</div>
                      ) : (
                        module.items.map((item) => (
                          <div key={item.id} className="content-item">
                            <div className="content-item-main">
                              <h3>{item.title}</h3>
                              <p>{item.type}</p>

                              {item.type === "PDF" && item.fileName && (
                                <span className="item-detail-line">File: {item.fileName}</span>
                              )}

                              {item.type === "External Video" && item.externalUrl && (
                                <span className="item-detail-line">Video link added</span>
                              )}

                              {item.type === "Link" && item.linkUrl && (
                                <span className="item-detail-line">External link added</span>
                              )}

                              {item.type === "Text Content" && item.textContent && (
                                <span className="item-detail-line">Text content ready</span>
                              )}

                              {item.type === "Quiz" && item.quiz && (
                                <span className="item-detail-line">
                                  {item.quiz.questions.length} question
                                  {item.quiz.questions.length !== 1 ? "s" : ""} ·{" "}
                                  {item.quiz.totalPoints} points · Pass {item.quiz.passingGrade}% ·
                                  Auto-graded
                                </span>
                              )}
                            </div>

                            <div className="content-item-actions">
                              <span
                                className={
                                  item.visible
                                    ? "item-status-pill visible"
                                    : "item-status-pill hidden"
                                }
                              >
                                {item.visible ? "Visible" : "Hidden"}
                              </span>

                              <button
                                className="outline-btn small-outline-btn"
                                onClick={() => toggleItemVisibility(module.id, item.id)}
                              >
                                {item.visible ? "Hide Item" : "Show Item"}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}

              {filteredAndSortedModules.length === 0 && (
                <div className="detail-card empty-search-state">
                  No modules or items matched your search.
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "Enrollment" && (
          <div className="detail-card">
            <div className="enrollment-header">
              <h2>Enrollment</h2>

              <div className="enrollment-controls">
                <input
                  type="text"
                  placeholder="Search enrolled members"
                  value={enrollmentSearch}
                  onChange={(e) => setEnrollmentSearch(e.target.value)}
                  className="enrollment-search"
                />

                <select
                  className="enrollment-sort"
                  value={enrollmentSort}
                  onChange={(e) => setEnrollmentSort(e.target.value)}
                >
                  <option value="default">Default Order</option>
                  <option value="date-newest">Enrollment Date: Newest</option>
                  <option value="date-oldest">Enrollment Date: Oldest</option>
                </select>
              </div>
            </div>

            <div className="student-table">
              <div className="student-row header six-col">
                <span>Name</span>
                <span>Member ID</span>
                <span>Role</span>
                <span>Progress</span>
                <span>Status</span>
                <span>Enrollment Date</span>
              </div>

              {filteredStudents.map((student) => (
                <div key={student.id} className="student-row six-col">
                  <span>{student.name}</span>
                  <span>{student.memberId}</span>
                  <span>{student.role}</span>
                  <span>{student.progress}%</span>
                  <span>{student.status}</span>
                  <span>{student.enrollmentDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAddModuleModal && (
          <div className="modal-overlay" onClick={() => setShowAddModuleModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2>Create Module</h2>

              <div className="modal-field">
                <label>Module Title</label>
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="Enter module title"
                />
              </div>

              <div className="modal-checkbox-row">
                <input
                  id="moduleVisible"
                  type="checkbox"
                  checked={newModuleVisible}
                  onChange={(e) => setNewModuleVisible(e.target.checked)}
                />
                <label htmlFor="moduleVisible">Make this module visible to students</label>
              </div>

              <div className="modal-actions">
                <button className="outline-btn" onClick={() => setShowAddModuleModal(false)}>
                  Cancel
                </button>
                <button className="gold-action-btn" onClick={handleCreateModule}>
                  Create Module
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddItemModal && (
          <div className="modal-overlay" onClick={() => setShowAddItemModal(false)}>
            <div className="modal-card large-modal-card" onClick={(e) => e.stopPropagation()}>
              <h2>Add Item</h2>

              <div className="modal-field">
                <label>Item Title</label>
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Enter item title"
                />
              </div>

              <div className="modal-field">
                <label>Item Type</label>
                <select value={newItemType} onChange={(e) => setNewItemType(e.target.value)}>
                  <option value="PDF">PDF</option>
                  <option value="External Video">External Video</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Text Content">Text Content</option>
                  <option value="Link">Link</option>
                </select>
              </div>

              {renderTypeSpecificFields()}

              <div className="modal-field">
                <label>Who should see this item?</label>
                <select
                  value={newItemAudienceType}
                  onChange={(e) => setNewItemAudienceType(e.target.value)}
                >
                  <option value="all">All students</option>
                  <option value="role">By leadership position</option>
                  <option value="member">Other: Member ID</option>
                </select>
              </div>

              {newItemAudienceType === "role" && (
                <div className="modal-field">
                  <label>Select leadership position</label>
                  <div className="position-grid compact-position-grid">
                    {roleOptions.map((role) => {
                      const checked = newItemAudienceRoles.includes(role);

                      return (
                        <label
                          key={role}
                          className={["position-option", checked ? "checked" : ""].join(" ").trim()}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleNewItemRole(role)}
                          />
                          <span className="custom-checkbox" />
                          <span className="position-label">{role}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {newItemAudienceType === "member" && (
                <div className="modal-field">
                  <label>Enter one or more member IDs</label>

                  <div className="member-id-entry">
                    <input
                      type="text"
                      value={newItemAudienceMemberIdInput}
                      onChange={(e) => setNewItemAudienceMemberIdInput(e.target.value)}
                      placeholder="Enter member IDs separated by commas"
                      className="member-id-input"
                    />
                    <button
                      type="button"
                      className="gold-action-btn small"
                      onClick={addNewItemMemberIds}
                    >
                      Add
                    </button>
                  </div>

                  <div className="member-id-tags">
                    {newItemAudienceMemberIds.map((id) => (
                      <span key={id} className="member-id-pill">
                        {id}
                        <button type="button" onClick={() => removeNewItemMemberId(id)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-checkbox-row">
                <input
                  id="itemVisible"
                  type="checkbox"
                  checked={newItemVisible}
                  onChange={(e) => setNewItemVisible(e.target.checked)}
                />
                <label htmlFor="itemVisible">Make this item visible to students</label>
              </div>

              <div className="modal-actions">
                <button className="outline-btn" onClick={() => setShowAddItemModal(false)}>
                  Cancel
                </button>
                <button className="gold-action-btn" onClick={handleCreateItem}>
                  Add Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}