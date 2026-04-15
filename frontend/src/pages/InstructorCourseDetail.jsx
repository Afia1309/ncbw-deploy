import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import InstructorLayout from "../components/InstructorLayout";
import "./InstructorCourseDetail.css";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api/training`;
const roleOptions = [
  "President",
  "Vice President",
  "Treasurer",
  "Secretary",
  "Chaplain",
  "Parliamentarian",
  "General Member",
];

const labelToBackendType = {
  PDF: "pdf",
  Video: "video",
  "External Video": "external_video",
  Quiz: "quiz",
  "Text Content": "text",
  Link: "link",
};

const backendTypeToLabel = {
  pdf: "PDF",
  video: "Video",
  external_video: "External Video",
  quiz: "Quiz",
  text: "Text Content",
  link: "Link",
};

const nowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createBlankQuestion = () => ({
  id: nowId(),
  prompt: "",
  points: 1,
  options: [
    { id: nowId(), text: "" },
    { id: nowId(), text: "" },
    { id: nowId(), text: "" },
    { id: nowId(), text: "" },
  ],
  correctOptionId: null,
});

const normalizeQuizQuestions = (quiz) => {
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return [createBlankQuestion()];
  }

  return quiz.questions.map((question) => ({
    id: question.id || nowId(),
    prompt: question.prompt || "",
    points: question.points ?? 1,
    options:
      Array.isArray(question.options) && question.options.length > 0
        ? question.options.map((option) => ({
            id: option.id || nowId(),
            text: option.text || "",
          }))
        : [
            { id: nowId(), text: "" },
            { id: nowId(), text: "" },
            { id: nowId(), text: "" },
            { id: nowId(), text: "" },
          ],
    correctOptionId: question.correctOptionId ?? null,
  }));
};

const calculateQuizTotalPoints = (questions) =>
  questions.reduce((sum, question) => sum + Number(question.points || 0), 0);

const getToken = () => 
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    "";

async function fetchWithAuth(url, options = {}) {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // non-JSON error body
    }
    const err = new Error(response.statusText || "Request failed.");
    err.fieldErrors = errorData || {};
    throw err;
  }

  if (response.status === 204) return null;
  return response.json();
}

export default function InstructorCourseDetail() {
  const { courseId } = useParams();
  const id = courseId;

  const [activeTab, setActiveTab] = useState("Overview");

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrollmentRows, setEnrollmentRows] = useState([]);

  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingEnrollment, setLoadingEnrollment] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [expandedModules, setExpandedModules] = useState({});

  const [visibilityLocked, setVisibilityLocked] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [memberIdInput, setMemberIdInput] = useState("");
  const [assignedMemberIds, setAssignedMemberIds] = useState([]);

  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");

  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleVisible, setNewModuleVisible] = useState(true);
  const [moduleFormError, setModuleFormError] = useState("");

  const [showItemModal, setShowItemModal] = useState(false);
  const [itemErrors, setItemErrors] = useState({});

  const setItemFieldError = (field, msg) =>
    setItemErrors((prev) => ({ ...prev, [field]: msg }));
  const clearItemFieldError = (field) =>
    setItemErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  const clearAllItemErrors = () => setItemErrors({});
  const [itemModalMode, setItemModalMode] = useState("create");
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemType, setNewItemType] = useState("PDF");
  const [newItemVisible, setNewItemVisible] = useState(true);

  const [newItemAudienceType, setNewItemAudienceType] = useState("all");
  const [newItemAudienceRoles, setNewItemAudienceRoles] = useState([]);
  const [newItemAudienceMemberIdInput, setNewItemAudienceMemberIdInput] = useState("");
  const [newItemAudienceMemberIds, setNewItemAudienceMemberIds] = useState([]);

  const [newItemFile, setNewItemFile] = useState(null);
  const [existingFileName, setExistingFileName] = useState("");
  const [newItemExternalUrl, setNewItemExternalUrl] = useState("");
  const [newItemTextContent, setNewItemTextContent] = useState("");
  const [newItemDueDate, setNewItemDueDate] = useState("");

  const [quizQuestions, setQuizQuestions] = useState([createBlankQuestion()]);
  const [quizPassingGrade, setQuizPassingGrade] = useState(70);

  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [enrollmentSort, setEnrollmentSort] = useState("default");

  const [contentSearch, setContentSearch] = useState("");
  const [contentSort, setContentSort] = useState("module-order");

  const courseStatus = course?.status || "Draft";
  const enrollmentCount = enrollmentRows.length;

  const loadCourseDetail = async () => {
    try {
      setLoadingCourse(true);
      setPageError("");

      const data = await fetchWithAuth(`${API_BASE}/instructor/courses/${id}/`);

      setCourse(data);
      setModules(data.modules || []);
      setSelectedRoles(data.selectedRoles || []);
      setAssignedMemberIds(data.assignedMemberIds || []);
      setVisibilityLocked(true);

      setExpandedModules((prev) => {
        const next = {};
        (data.modules || []).forEach((module) => {
          next[module.id] = prev[module.id] ?? false;
        });
        return next;
      });
    } catch (error) {
      console.error(error);
      setPageError("Failed to load course details.");
    } finally {
      setLoadingCourse(false);
    }
  };

  const loadEnrollment = async () => {
    try {
      setLoadingEnrollment(true);
      const data = await fetchWithAuth(`${API_BASE}/instructor/courses/${id}/enrollment/`);
      setEnrollmentRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingEnrollment(false);
    }
  };

  useEffect(() => {
    loadCourseDetail();
    loadEnrollment();
  }, [id]);

  const filteredStudents = useMemo(() => {
    const value = enrollmentSearch.trim().toLowerCase();
    let result = [...enrollmentRows];

    if (value) {
      result = result.filter((student) => {
        return (
          (student.name || "").toLowerCase().includes(value) ||
          (student.memberId || "").toLowerCase().includes(value) ||
          (student.role || "").toLowerCase().includes(value) ||
          (student.status || "").toLowerCase().includes(value) ||
          (student.enrollmentDate || "").toLowerCase().includes(value)
        );
      });
    }

    if (enrollmentSort === "date-newest") {
      result.sort((a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate));
    }

    if (enrollmentSort === "date-oldest") {
      result.sort((a, b) => new Date(a.enrollmentDate) - new Date(b.enrollmentDate));
    }

    return result;
  }, [enrollmentRows, enrollmentSearch, enrollmentSort]);

  const filteredAndSortedModules = useMemo(() => {
    let result = [...modules];
    const search = contentSearch.trim().toLowerCase();

    if (search) {
      result = result.filter((module) => {
        const moduleMatch = (module.title || "").toLowerCase().includes(search);

        const itemMatch = (module.items || []).some((item) => {
          const detailText = [
            item.title,
            item.type,
            item.fileName,
            item.external_url,
            item.text_content,
            item.audience_type,
            ...(item.audienceRoles || []),
            ...(item.audienceMemberIds || []),
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
      result.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    }

    if (contentSort === "module-name-asc") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    if (contentSort === "module-name-desc") {
      result.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    }

    return result;
  }, [modules, contentSearch, contentSort]);

  const toggleRole = (role) => {
    if (visibilityLocked) return;

    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
    );
  };

  const handleAddMemberId = () => {
    if (visibilityLocked) return;

    const parsedIds = memberIdInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!parsedIds.length) return;

    setAssignedMemberIds((prev) => {
      const merged = [...prev];
      parsedIds.forEach((memberId) => {
        if (!merged.includes(memberId)) merged.push(memberId);
      });
      return merged;
    });

    setMemberIdInput("");
  };

  const removeMemberId = (idToRemove) => {
    if (visibilityLocked) return;
    setAssignedMemberIds((prev) => prev.filter((memberId) => memberId !== idToRemove));
  };

  const handleSaveVisibility = async () => {
    try {
      setActionLoading(true);

      await fetchWithAuth(`${API_BASE}/instructor/courses/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedRoles,
          assignedMemberIds,
        }),
      });

      setVisibilityLocked(true);
      await loadCourseDetail();
      await loadEnrollment();
    } catch (error) {
      console.error(error);
      alert("Failed to save visibility settings.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCourseStatus = async () => {
    if (!course) return;

    const nextStatus = course.status === "Published" ? "Draft" : "Published";

    try {
      setActionLoading(true);

      await fetchWithAuth(`${API_BASE}/instructor/courses/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      setCourse((prev) => ({ ...prev, status: nextStatus }));
      await loadEnrollment();
    } catch (error) {
      console.error(error);
      alert("Failed to update course status.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleModuleExpanded = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const startEditingModuleTitle = (module) => {
    setEditingModuleId(module.id);
    setEditingModuleTitle(module.title || "");
  };

  const cancelModuleTitleEdit = () => {
    setEditingModuleId(null);
    setEditingModuleTitle("");
  };

  const saveModuleTitle = async (moduleId) => {
    const trimmed = editingModuleTitle.trim();
    if (!trimmed) return;

    try {
      setActionLoading(true);

      await fetchWithAuth(`${API_BASE}/instructor/modules/${moduleId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmed,
        }),
      });

      setModules((prev) =>
        prev.map((module) => (module.id === moduleId ? { ...module, title: trimmed } : module))
      );

      cancelModuleTitleEdit();
    } catch (error) {
      console.error(error);
      alert("Failed to update module title.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleModuleVisibility = async (module) => {
    try {
      setActionLoading(true);

      const updated = await fetchWithAuth(`${API_BASE}/instructor/modules/${module.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_visible: !module.visible,
        }),
      });

      const nextVisible = updated?.module?.visible ?? !module.visible;

      setModules((prev) =>
        prev.map((item) => (item.id === module.id ? { ...item, visible: nextVisible } : item))
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update module visibility.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    const confirmed = window.confirm("Delete this module and all its items?");
    if (!confirmed) return;

    try {
      setActionLoading(true);

      await fetchWithAuth(`${API_BASE}/instructor/modules/${moduleId}/`, {
        method: "DELETE",
      });

      setModules((prev) => prev.filter((module) => module.id !== moduleId));
      setExpandedModules((prev) => {
        const next = { ...prev };
        delete next[moduleId];
        return next;
      });
    } catch (error) {
      console.error(error);
      alert("Failed to delete module.");
    } finally {
      setActionLoading(false);
    }
  };

  const resetItemForm = () => {
    setEditingItemId(null);
    setSelectedModuleId(null);
    setItemModalMode("create");

    setNewItemTitle("");
    setNewItemType("PDF");
    setNewItemVisible(true);

    setNewItemAudienceType("all");
    setNewItemAudienceRoles([]);
    setNewItemAudienceMemberIdInput("");
    setNewItemAudienceMemberIds([]);

    setNewItemFile(null);
    setExistingFileName("");
    setNewItemExternalUrl("");
    setNewItemTextContent("");
    setNewItemDueDate("");

    setQuizQuestions([createBlankQuestion()]);
    setQuizPassingGrade(70);
  };

  const openAddItemModal = (moduleId) => {
    resetItemForm();
    setSelectedModuleId(moduleId);
    setItemModalMode("create");
    setShowItemModal(true);
  };

  const openEditItemModal = (moduleId, item) => {
    resetItemForm();

    setSelectedModuleId(moduleId);
    setEditingItemId(item.id);
    setItemModalMode("edit");

    setNewItemTitle(item.title || "");
    setNewItemType(item.type || "PDF");
    setNewItemVisible(Boolean(item.visible));

    setNewItemAudienceType(item.audience_type || "all");
    setNewItemAudienceRoles(item.audienceRoles || []);
    setNewItemAudienceMemberIds(item.audienceMemberIds || []);

    setExistingFileName(item.fileName || "");
    setNewItemExternalUrl(item.external_url || "");
    setNewItemTextContent(item.text_content || "");
    setNewItemDueDate(item.due_date || "");

    if (item.type === "Quiz") {
      setQuizPassingGrade(item.quiz?.passingGrade ?? 70);
      setQuizQuestions(normalizeQuizQuestions(item.quiz));
    }

    setShowItemModal(true);
  };

  const toggleNewItemRole = (role) => {
    setNewItemAudienceRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
    );
  };

  const addNewItemMemberIds = () => {
    const parsedIds = newItemAudienceMemberIdInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!parsedIds.length) return;

    setNewItemAudienceMemberIds((prev) => {
      const merged = [...prev];
      parsedIds.forEach((memberId) => {
        if (!merged.includes(memberId)) merged.push(memberId);
      });
      return merged;
    });

    setNewItemAudienceMemberIdInput("");
  };

  const removeNewItemMemberId = (idToRemove) => {
    setNewItemAudienceMemberIds((prev) => prev.filter((memberId) => memberId !== idToRemove));
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
        question.id === questionId ? { ...question, correctOptionId: optionId } : question
      )
    );
  };

  const buildItemJsonPayload = () => {
    const backendType = labelToBackendType[newItemType];

    const payload = {
      module: selectedModuleId,
      title: newItemTitle.trim(),
      item_type: backendType,
      is_visible: newItemVisible,
      audience_type: newItemAudienceType,
      audience_roles: newItemAudienceRoles,
      audience_member_ids: newItemAudienceMemberIds,
      due_date: newItemDueDate || null,
    };

    if (backendType === "external_video" || backendType === "link") {
      payload.external_url = newItemExternalUrl.trim();
    }

    if (backendType === "text") {
      payload.text_content = newItemTextContent.trim();
    }

    if (backendType === "quiz") {
      const cleanedQuestions = quizQuestions
        .map((question) => ({
          id: question.id,
          prompt: question.prompt.trim(),
          points: Number(question.points || 0),
          options: question.options
            .map((option) => ({
              id: option.id,
              text: option.text.trim(),
            }))
            .filter((option) => option.text),
          correctOptionId: question.correctOptionId,
        }))
        .filter(
          (question) =>
            question.prompt &&
            question.options.length >= 2 &&
            question.correctOptionId &&
            question.points > 0
        );

      if (!cleanedQuestions.length) {
        throw new Error("Quiz must include at least one valid question.");
      }

      payload.quiz_data = {
        autoGrade: true,
        passingGrade: Number(quizPassingGrade || 0),
        questions: cleanedQuestions,
        totalPoints: calculateQuizTotalPoints(cleanedQuestions),
      };
    }

    return payload;
  };

  const buildItemFormDataPayload = () => {
    const backendType = labelToBackendType[newItemType];
    const formData = new FormData();

    formData.append("module", selectedModuleId);
    formData.append("title", newItemTitle.trim());
    formData.append("item_type", backendType);
    formData.append("is_visible", newItemVisible ? "true" : "false");
    formData.append("audience_type", newItemAudienceType);

    newItemAudienceRoles.forEach((role) => {
      formData.append("audience_roles", role);
    });

    newItemAudienceMemberIds.forEach((memberId) => {
      formData.append("audience_member_ids", memberId);
    });

    if (newItemFile) {
      formData.append("file", newItemFile);
    }

    if (newItemDueDate) {
      formData.append("due_date", newItemDueDate);
    }

    return formData;
  };

  const handleCreateModule = async () => {
    const trimmed = newModuleTitle.trim();
    if (!trimmed) {
      setModuleFormError("Module title is required.");
      return;
    }
    setModuleFormError("");

    try {
      setActionLoading(true);

      await fetchWithAuth(`${API_BASE}/instructor/courses/${id}/modules/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmed,
          is_visible: newModuleVisible,
        }),
      });

      setShowAddModuleModal(false);
      setNewModuleTitle("");
      setNewModuleVisible(true);
      await loadCourseDetail();
    } catch (error) {
      console.error(error);
      alert("Failed to create module.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitItem = async () => {
    const backendType = labelToBackendType[newItemType];
    const isFileItem = backendType === "pdf" || backendType === "video";
    const isEditing = itemModalMode === "edit" && editingItemId;

    // Per-field validation — each error goes to the field it belongs to
    const errors = {};

    if (!newItemTitle.trim()) {
      errors.title = "Item title is required.";
    }
    if (isFileItem && itemModalMode === "create" && !newItemFile) {
      errors.file = `A ${newItemType} file is required.`;
    }
    if ((backendType === "external_video" || backendType === "link") && !newItemExternalUrl.trim()) {
      errors.url = "A URL is required.";
    }
    if (backendType === "text" && !newItemTextContent.trim()) {
      errors.content = "Text content is required.";
    }
    if (backendType === "quiz") {
      const hasValidQuestion = quizQuestions.some(
        (q) =>
          q.prompt.trim() &&
          q.options.filter((o) => o.text.trim()).length >= 2 &&
          q.correctOptionId &&
          Number(q.points) > 0
      );
      if (!hasValidQuestion) {
        errors.quiz = "Add at least one question with a prompt, 2+ options, a correct answer, and a point value.";
      }
    }
    if (newItemAudienceType === "role" && !newItemAudienceRoles.length) {
      errors.audience = "Select at least one leadership role.";
    }
    if (newItemAudienceType === "member" && !newItemAudienceMemberIds.length) {
      errors.audience = "Add at least one member ID.";
    }

    if (Object.keys(errors).length > 0) {
      setItemErrors(errors);
      return;
    }

    clearAllItemErrors();

    try {
      setActionLoading(true);

      let url = `${API_BASE}/instructor/modules/${selectedModuleId}/items/`;
      let method = "POST";
      let headers = {};
      let body;

      if (isEditing) {
        url = `${API_BASE}/instructor/items/${editingItemId}/`;
        method = "PATCH";
      }

      if (isFileItem && (newItemFile || itemModalMode === "create")) {
        body = buildItemFormDataPayload();
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(buildItemJsonPayload());
      }

      await fetchWithAuth(url, {
        method,
        headers,
        body,
      });

      setShowItemModal(false);
      resetItemForm();
      await loadCourseDetail();

      if (selectedModuleId) {
        setExpandedModules((prev) => ({
          ...prev,
          [selectedModuleId]: true,
        }));
      }
    } catch (error) {
      console.error(error);
      // Map backend field errors to the correct fields
      const fe = error.fieldErrors || {};
      const mapped = {};
      if (fe.title) mapped.title = fe.title[0] || fe.title;
      if (fe.file) mapped.file = fe.file[0] || fe.file;
      if (fe.external_url) mapped.url = fe.external_url[0] || fe.external_url;
      if (fe.text_content) mapped.content = fe.text_content[0] || fe.text_content;
      if (fe.quiz_data) mapped.quiz = fe.quiz_data[0] || fe.quiz_data;
      if (fe.audience_type || fe.audience_roles || fe.audience_member_ids) {
        mapped.audience = (fe.audience_type || fe.audience_roles || fe.audience_member_ids || ["Audience error"])[0];
      }
      if (Object.keys(mapped).length > 0) {
        setItemErrors(mapped);
      } else {
        setItemErrors({ general: "Failed to save item. Please try again." });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const toggleItemVisibility = async (item) => {
    try {
      setActionLoading(true);

      await fetchWithAuth(`${API_BASE}/instructor/items/${item.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_visible: !item.visible,
        }),
      });

      setModules((prev) =>
        prev.map((module) => ({
          ...module,
          items: (module.items || []).map((entry) =>
            entry.id === item.id ? { ...entry, visible: !entry.visible } : entry
          ),
        }))
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update item visibility.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) return;

    try {
      setActionLoading(true);

      await fetchWithAuth(`${API_BASE}/instructor/items/${itemId}/`, {
        method: "DELETE",
      });

      setModules((prev) =>
        prev.map((module) => ({
          ...module,
          items: (module.items || []).filter((item) => item.id !== itemId),
        }))
      );
    } catch (error) {
      console.error(error);
      alert("Failed to delete item.");
    } finally {
      setActionLoading(false);
    }
  };

  const renderTypeSpecificFields = () => {
    if (newItemType === "PDF") {
      return (
        <div className="modal-field">
          <label>Upload PDF</label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => { setNewItemFile(e.target.files?.[0] || null); clearItemFieldError("file"); }}
            className="file-input"
          />
          {existingFileName && itemModalMode === "edit" && !newItemFile && (
            <p className="field-helper">Current file: {existingFileName}</p>
          )}
          {newItemFile && <p className="field-helper">Selected file: {newItemFile.name}</p>}
          {itemErrors.file && (
            <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "4px", marginBottom: 0 }}>
              {itemErrors.file}
            </p>
          )}
        </div>
      );
    }

    if (newItemType === "Video") {
      return (
        <div className="modal-field">
          <label>Upload Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => { setNewItemFile(e.target.files?.[0] || null); clearItemFieldError("file"); }}
            className="file-input"
          />
          {existingFileName && itemModalMode === "edit" && !newItemFile && (
            <p className="field-helper">Current file: {existingFileName}</p>
          )}
          {newItemFile && <p className="field-helper">Selected file: {newItemFile.name}</p>}
          {itemErrors.file && (
            <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "4px", marginBottom: 0 }}>
              {itemErrors.file}
            </p>
          )}
        </div>
      );
    }

    if (newItemType === "External Video" || newItemType === "Link") {
      return (
        <div className="modal-field">
          <label>{newItemType === "External Video" ? "Video URL" : "Link URL"}</label>
          <input
            type="url"
            value={newItemExternalUrl}
            onChange={(e) => { setNewItemExternalUrl(e.target.value); clearItemFieldError("url"); }}
            placeholder={
              newItemType === "External Video" ? "Paste external video link" : "Paste link"
            }
          />
          {itemErrors.url && (
            <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "4px", marginBottom: 0 }}>
              {itemErrors.url}
            </p>
          )}
        </div>
      );
    }

    if (newItemType === "Text Content") {
      return (
        <div className="modal-field">
          <label>Text Content</label>
          <textarea
            value={newItemTextContent}
            onChange={(e) => { setNewItemTextContent(e.target.value); clearItemFieldError("content"); }}
            placeholder="Enter the text students should read"
            rows={6}
          />
          {itemErrors.content && (
            <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "4px", marginBottom: 0 }}>
              {itemErrors.content}
            </p>
          )}
        </div>
      );
    }

    if (newItemType === "Quiz") {
      const totalPoints = calculateQuizTotalPoints(
        quizQuestions.map((question) => ({
          ...question,
          points: Number(question.points || 0),
        }))
      );

      return (
        <div className="quiz-builder">
          <div className="quiz-builder-header">
            <div>
              <h3>Quiz Builder</h3>
              <p>
                Add questions, edit them any time, set the correct answers, assign points, and
                define the passing grade.
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

          {itemErrors.quiz && (
            <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "8px", marginBottom: 0 }}>
              {itemErrors.quiz}
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  if (loadingCourse) {
    return (
      <InstructorLayout
        breadcrumbs={[
          { label: "My Courses", path: "/instructor/courses" },
          { label: "Loading...", path: "#" },
        ]}
      >
        <div className="course-detail-page">
          <p>Loading course...</p>
        </div>
      </InstructorLayout>
    );
  }

  if (pageError || !course) {
    return (
      <InstructorLayout
        breadcrumbs={[
          { label: "My Courses", path: "/instructor/courses" },
          { label: "Error", path: "#" },
        ]}
      >
        <div className="course-detail-page">
          <p>{pageError || "Course not found."}</p>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout
      breadcrumbs={[
        { label: "My Courses", path: "/instructor/courses" },
        { label: course.title || course.name, path: `/instructor/courses/${id}` },
        { label: activeTab, path: "#" },
      ]}
    >
      <div className="course-detail-page">
        <div className="course-detail-header">
          <div>
            <h1>{course.title || course.name}</h1>
          </div>

          {activeTab === "Content" && (
            <button className="gold-action-btn" onClick={() => setShowAddModuleModal(true)}>
              + Add Module
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
                  onClick={handleToggleCourseStatus}
                  disabled={actionLoading}
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

            <div className={`detail-card visibility-card ${visibilityLocked ? "saved" : ""}`}>
              <div className="visibility-header">
                <div>
                  <h2>Visibility & Assignment</h2>
                  <p className="section-helper-text">
                    Control who can see this course by leadership position or by specific member ID.
                  </p>
                </div>

                {visibilityLocked ? (
                  <button className="outline-btn" onClick={() => setVisibilityLocked(false)}>
                    Edit Visibility
                  </button>
                ) : (
                  <button className="outline-btn" onClick={handleSaveVisibility} disabled={actionLoading}>
                    Save Visibility
                  </button>
                )}
              </div>

              {visibilityLocked && (
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
                          visibilityLocked ? "disabled" : "",
                        ]
                          .join(" ")
                          .trim()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRole(role)}
                          disabled={visibilityLocked}
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
                    disabled={visibilityLocked}
                  />
                  <button
                    type="button"
                    className="gold-action-btn small"
                    onClick={handleAddMemberId}
                    disabled={visibilityLocked}
                  >
                    Add
                  </button>
                </div>

                <div className="member-id-tags">
                  {assignedMemberIds.map((memberId) => (
                    <span
                      key={memberId}
                      className={visibilityLocked ? "member-id-pill disabled" : "member-id-pill"}
                    >
                      {memberId}
                      <button
                        type="button"
                        onClick={() => removeMemberId(memberId)}
                        disabled={visibilityLocked}
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
                          aria-label={expandedModules[module.id] ? "Collapse module" : "Expand module"}
                          title={expandedModules[module.id] ? "Collapse module" : "Expand module"}
                        >
                          <span className={`accordion-arrow ${expandedModules[module.id] ? "open" : ""}`}>
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
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => handleDeleteModule(module.id)}
                              title="Delete module"
                              aria-label="Delete module"
                            >
                              🗑
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
                          onClick={() => toggleModuleVisibility(module)}
                        >
                          {module.visible ? "Hide Module" : "Show Module"}
                        </button>
                      </div>
                    </div>

                    <button className="outline-btn" onClick={() => openAddItemModal(module.id)}>
                      + Add Item
                    </button>
                  </div>

                  {expandedModules[module.id] && (
                    <div className="content-item-list">
                      {!module.items || module.items.length === 0 ? (
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

                              {(item.type === "External Video" || item.type === "Link") &&
                                item.external_url && (
                                  <span className="item-detail-line">
                                    URL:{" "}
                                    <a
                                      href={item.external_url}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Open link
                                    </a>
                                  </span>
                                )}

                              {item.type === "Text Content" && item.text_content && (
                                <span className="item-detail-line">Text content ready</span>
                              )}

                              {item.type === "Quiz" && item.quiz && (
                                <span className="item-detail-line">
                                  {item.quiz.questions?.length || 0} question
                                  {(item.quiz.questions?.length || 0) !== 1 ? "s" : ""} ·{" "}
                                  {item.quiz.totalPoints || 0} points · Pass{" "}
                                  {item.quiz.passingGrade ?? 70}% · Auto-graded
                                </span>
                              )}

                              {item.audience_type === "role" && item.audienceRoles?.length > 0 && (
                                <span className="item-detail-line">
                                  Visible to: {item.audienceRoles.join(", ")}
                                </span>
                              )}

                              {item.audience_type === "member" &&
                                item.audienceMemberIds?.length > 0 && (
                                  <span className="item-detail-line">
                                    Member IDs: {item.audienceMemberIds.join(", ")}
                                  </span>
                                )}
                            </div>

                            <div className="content-item-actions">
                              <span
                                className={
                                  item.visible ? "item-status-pill visible" : "item-status-pill hidden"
                                }
                              >
                                {item.visible ? "Visible" : "Hidden"}
                              </span>

                              <button
                                className="outline-btn small-outline-btn"
                                onClick={() => toggleItemVisibility(item)}
                              >
                                {item.visible ? "Hide Item" : "Show Item"}
                              </button>

                              <button
                                className="outline-btn small-outline-btn"
                                onClick={() => openEditItemModal(module.id, item)}
                              >
                                Edit
                              </button>

                              <button
                                className="outline-btn small-outline-btn"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                Delete
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

            {loadingEnrollment ? (
              <p>Loading enrollment...</p>
            ) : (
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

                {!filteredStudents.length && (
                  <div className="empty-module-state">No enrolled members match your search.</div>
                )}
              </div>
            )}
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
                  onChange={(e) => { setNewModuleTitle(e.target.value); setModuleFormError(""); }}
                  placeholder="Enter module title"
                />
                {moduleFormError && (
                  <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "4px", marginBottom: 0 }}>
                    {moduleFormError}
                  </p>
                )}
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
                <button className="gold-action-btn" onClick={handleCreateModule} disabled={actionLoading}>
                  Create Module
                </button>
              </div>
            </div>
          </div>
        )}

        {showItemModal && (
          <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
            <div className="modal-card large-modal-card" onClick={(e) => e.stopPropagation()}>
              <h2>{itemModalMode === "edit" ? "Edit Item" : "Add Item"}</h2>

              {itemErrors.general && (
                <p style={{ color: "#dc2626", fontSize: "0.82rem", marginBottom: "8px" }}>
                  {itemErrors.general}
                </p>
              )}

              <div className="modal-field">
                <label>Item Title</label>
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => { setNewItemTitle(e.target.value); clearItemFieldError("title"); }}
                  placeholder="Enter item title"
                />
                {itemErrors.title && (
                  <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "4px", marginBottom: 0 }}>
                    {itemErrors.title}
                  </p>
                )}
              </div>

              <div className="modal-field">
                <label>Item Type</label>
                <select value={newItemType} onChange={(e) => setNewItemType(e.target.value)}>
                  <option value="PDF">PDF</option>
                  <option value="Video">Video (upload)</option>
                  <option value="External Video">External Video (link)</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Text Content">Text Content</option>
                  <option value="Link">Link</option>
                </select>
              </div>

              {renderTypeSpecificFields()}

              <div className="modal-field">
                <label>Due Date (optional)</label>
                <input
                  type="date"
                  value={newItemDueDate}
                  onChange={(e) => setNewItemDueDate(e.target.value)}
                />
              </div>

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
                            onChange={() => { toggleNewItemRole(role); clearItemFieldError("audience"); }}
                          />
                          <span className="custom-checkbox" />
                          <span className="position-label">{role}</span>
                        </label>
                      );
                    })}
                  </div>
                  {itemErrors.audience && (
                    <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "4px", marginBottom: 0 }}>
                      {itemErrors.audience}
                    </p>
                  )}
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
                    {newItemAudienceMemberIds.map((memberId) => (
                      <span key={memberId} className="member-id-pill">
                        {memberId}
                        <button type="button" onClick={() => removeNewItemMemberId(memberId)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {itemErrors.audience && (
                    <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "4px", marginBottom: 0 }}>
                      {itemErrors.audience}
                    </p>
                  )}
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
                <button
                  className="outline-btn"
                  onClick={() => {
                    setShowItemModal(false);
                    clearAllItemErrors();
                    resetItemForm();
                  }}
                >
                  Cancel
                </button>
                <button className="gold-action-btn" onClick={handleSubmitItem} disabled={actionLoading}>
                  {itemModalMode === "edit" ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
