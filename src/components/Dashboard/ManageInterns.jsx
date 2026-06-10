import React, { useState } from "react";
import { Search, Filter, Edit2, Check, X, Layers, Users, CheckSquare, Plus, Trash2, UserPlus, Settings } from "lucide-react";
import { translations } from "../../translations";
import InternImage from "../InternImage";

export default function ManageInterns({
  rotations,
  onAddIntern,
  onUpdateIntern,
  onDeleteIntern,
  onBulkUpdateInterns,
  onUpdateDepartments,
  lang,
  mainDepartments = [],
  secondaryDepartments = []
}) {
  const t = translations[lang];
  const isRtl = lang === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  
  // Selection state for bulk editing
  const [selectedNames, setSelectedNames] = useState([]);

  // Inline edit state
  const [editingName, setEditingName] = useState(null);
  const [editInternName, setEditInternName] = useState("");
  const [editMainDept, setEditMainDept] = useState("");
  const [editSecDept, setEditSecDept] = useState("");
  const [editDrivePhotoId, setEditDrivePhotoId] = useState("");

  // Bulk edit form state
  const [bulkMainDept, setBulkMainDept] = useState("");
  const [bulkSecDept, setBulkSecDept] = useState("");
  const [updateMainActive, setUpdateMainActive] = useState(false);
  const [updateSecActive, setUpdateSecActive] = useState(false);

  // Add Intern state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInternName, setNewInternName] = useState("");
  const [newInternMainDept, setNewInternMainDept] = useState("");
  const [newInternSecDept, setNewInternSecDept] = useState("");
  const [newInternPhotoId, setNewInternPhotoId] = useState("");

  // Department Manager state
  const [showDeptManager, setShowDeptManager] = useState(false);
  const [newMainDeptName, setNewMainDeptName] = useState("");
  const [newSecDeptName, setNewSecDeptName] = useState("");

  // Filtered interns list
  const filteredInterns = rotations.filter((r) => {
    const matchesSearch = r.intern_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      !deptFilter ||
      r.main_department === deptFilter ||
      r.secondary_department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleStartEdit = (intern) => {
    setEditingName(intern.intern_name);
    setEditInternName(intern.intern_name);
    setEditMainDept(intern.main_department || "");
    setEditSecDept(intern.secondary_department || "");
    setEditDrivePhotoId(intern.drive_photo_id || "");
  };

  const handleCancelEdit = () => {
    setEditingName(null);
  };

  const handleSaveEdit = (oldName) => {
    if (!editInternName.trim()) {
      alert(isRtl ? "الرجاء إدخال اسم الطالب!" : "Please enter intern name!");
      return;
    }
    onUpdateIntern(oldName, {
      intern_name: editInternName.trim(),
      main_department: editMainDept,
      secondary_department: editSecDept,
      drive_photo_id: editDrivePhotoId.trim()
    });
    setEditingName(null);
  };

  const handleDeleteInternClick = (name) => {
    const confirmMsg = isRtl
      ? `هل أنت متأكد من حذف الطالب "${name}" تماماً من قاعدة البيانات؟`
      : `Are you sure you want to delete "${name}" from the database?`;
    if (window.confirm(confirmMsg)) {
      onDeleteIntern(name);
      setSelectedNames((prev) => prev.filter((n) => n !== name));
    }
  };

  // Selection Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedNames(filteredInterns.map((r) => r.intern_name));
    } else {
      setSelectedNames([]);
    }
  };

  const handleSelectRow = (name, checked) => {
    if (checked) {
      setSelectedNames((prev) => [...prev, name]);
    } else {
      setSelectedNames((prev) => prev.filter((n) => n !== name));
    }
  };

  const handleApplyBulk = () => {
    if (selectedNames.length === 0) return;
    
    onBulkUpdateInterns(
      selectedNames,
      updateMainActive ? bulkMainDept : undefined,
      updateSecActive ? bulkSecDept : undefined
    );

    // Clear form states
    setSelectedNames([]);
    setUpdateMainActive(false);
    setUpdateSecActive(false);
    setBulkMainDept("");
    setBulkSecDept("");
  };

  const handleClearSelection = () => {
    setSelectedNames([]);
    setUpdateMainActive(false);
    setUpdateSecActive(false);
  };

  // Department CRUD operations
  const handleAddMainDept = (e) => {
    e.preventDefault();
    const name = newMainDeptName.trim();
    if (!name) return;
    if (mainDepartments.includes(name)) {
      alert(isRtl ? "هذا القسم موجود بالفعل!" : "This department already exists!");
      return;
    }
    const updatedMain = [...mainDepartments, name];
    onUpdateDepartments(updatedMain, secondaryDepartments);
    setNewMainDeptName("");
  };

  const handleDeleteMainDept = (name) => {
    const activeCount = rotations.filter((r) => r.main_department === name).length;
    if (activeCount > 0) {
      const msg = isRtl
        ? `عذراً، لا يمكن حذف القسم "${name}" لوجود عدد (${activeCount}) طالب مسجلين به حالياً. قم بنقل الطلاب أولاً.`
        : `Cannot delete department "${name}" because there are (${activeCount}) interns assigned to it. Reassign them first.`;
      alert(msg);
      return;
    }
    const confirmMsg = isRtl
      ? `هل أنت متأكد من حذف قسم "${name}"؟`
      : `Are you sure you want to delete department "${name}"?`;
    if (window.confirm(confirmMsg)) {
      const updatedMain = mainDepartments.filter((d) => d !== name);
      onUpdateDepartments(updatedMain, secondaryDepartments);
    }
  };

  const handleAddSecDept = (e) => {
    e.preventDefault();
    const name = newSecDeptName.trim();
    if (!name) return;
    if (secondaryDepartments.includes(name)) {
      alert(isRtl ? "هذه الخدمة موجودة بالفعل!" : "This service already exists!");
      return;
    }
    const updatedSec = [...secondaryDepartments, name];
    onUpdateDepartments(mainDepartments, updatedSec);
    setNewSecDeptName("");
  };

  const handleDeleteSecDept = (name) => {
    const activeCount = rotations.filter((r) => r.secondary_department === name).length;
    if (activeCount > 0) {
      const msg = isRtl
        ? `عذراً، لا يمكن حذف الخدمة "${name}" لوجود عدد (${activeCount}) طالب مسجلين بها حالياً. قم بنقل الطلاب أولاً.`
        : `Cannot delete service "${name}" because there are (${activeCount}) interns assigned to it. Reassign them first.`;
      alert(msg);
      return;
    }
    const confirmMsg = isRtl
      ? `هل أنت متأكد من حذف خدمة "${name}"؟`
      : `Are you sure you want to delete service "${name}"?`;
    if (window.confirm(confirmMsg)) {
      const updatedSec = secondaryDepartments.filter((d) => d !== name);
      onUpdateDepartments(mainDepartments, updatedSec);
    }
  };

  // Add Intern submit
  const handleAddInternSubmit = (e) => {
    e.preventDefault();
    if (!newInternName.trim()) {
      alert(isRtl ? "الرجاء إدخال اسم الطالب!" : "Please enter intern name!");
      return;
    }
    if (!newInternMainDept) {
      alert(isRtl ? "الرجاء اختيار قسم الخدمة الأساسي!" : "Please select a primary department!");
      return;
    }

    onAddIntern({
      intern_name: newInternName.trim(),
      main_department: newInternMainDept,
      secondary_department: newInternSecDept || "",
      drive_photo_id: newInternPhotoId.trim()
    });

    setNewInternName("");
    setNewInternMainDept("");
    setNewInternSecDept("");
    setNewInternPhotoId("");
    setShowAddForm(false);
  };

  // Render variables
  const allSelected = filteredInterns.length > 0 && selectedNames.length === filteredInterns.length;
  const anySelected = selectedNames.length > 0;

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 ${
      isRtl ? "text-right" : "text-left"
    } animate-fade-in`}>
      
      {/* Header Info */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 ${
        isRtl ? "sm:flex-row-reverse" : "sm:flex-row"
      }`} dir={isRtl ? "rtl" : "ltr"}>
        <div>
          <h2 className="text-2xl font-bold font-arabic text-slate-800">
            {isRtl ? "قاعدة بيانات طلاب إعداد الخدمة" : "Prep-Servants Database"}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5 font-light">
            {isRtl 
              ? "لوحة التحكم الكاملة لإضافة الطلاب وتعديلهم والتحكم في هيكل أقسام الخدمة" 
              : "Full admin panel to manage prep-servant interns and service departments structure"}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Manage Departments button */}
          <button
            onClick={() => setShowDeptManager(!showDeptManager)}
            className={`px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>{isRtl ? "إدارة الأقسام" : "Manage Departments"}</span>
          </button>
          
          {/* Add Intern button */}
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (showAddForm) {
                setNewInternName("");
                setNewInternMainDept("");
                setNewInternSecDept("");
                setNewInternPhotoId("");
              }
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isRtl ? "إضافة طالب جديد" : "Add New Intern"}</span>
          </button>
        </div>
      </div>

      {/* Departments Manager Panel */}
      {showDeptManager && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-inner animate-scale-up" dir={isRtl ? "rtl" : "ltr"}>
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 font-arabic">
              <Settings className="w-5 h-5 text-indigo-500" />
              <span>{isRtl ? "إدارة الأقسام المتاحة" : "Available Service Departments Structure"}</span>
            </h3>
            <button
              onClick={() => setShowDeptManager(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Departments Column */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block font-arabic border-b border-slate-200/50 pb-1">
                {isRtl ? "أقسام الخدمة الأساسية (Rotations)" : "Primary Departments"}
              </span>
              
              {/* Add main dept */}
              <form onSubmit={handleAddMainDept} className="flex gap-2">
                <input
                  type="text"
                  placeholder={isRtl ? "اسم القسم الأساسي..." : "Primary department name..."}
                  value={newMainDeptName}
                  onChange={(e) => setNewMainDeptName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-arabic"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Main depts list */}
              <div className="bg-white border border-slate-200 rounded-2xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                {mainDepartments.map((dept) => (
                  <div key={dept} className="px-3 py-2 flex items-center justify-between text-xs font-arabic text-slate-700">
                    <span>{dept}</span>
                    <button
                      onClick={() => handleDeleteMainDept(dept)}
                      className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Services Column */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block font-arabic border-b border-slate-200/50 pb-1">
                {isRtl ? "الخدمات والأنشطة الفرعية (Secondary)" : "Secondary Services"}
              </span>
              
              {/* Add secondary dept */}
              <form onSubmit={handleAddSecDept} className="flex gap-2">
                <input
                  type="text"
                  placeholder={isRtl ? "اسم الخدمة الفرعية..." : "Secondary service name..."}
                  value={newSecDeptName}
                  onChange={(e) => setNewSecDeptName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-arabic"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Secondary depts list */}
              <div className="bg-white border border-slate-200 rounded-2xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                {secondaryDepartments.map((dept) => (
                  <div key={dept} className="px-3 py-2 flex items-center justify-between text-xs font-arabic text-slate-700">
                    <span>{dept}</span>
                    <button
                      onClick={() => handleDeleteSecDept(dept)}
                      className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Intern Form Panel */}
      {showAddForm && (
        <form
          onSubmit={handleAddInternSubmit}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-scale-up space-y-4"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 font-arabic">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              <span>{isRtl ? "تسجيل طالب إعداد خدمة جديد" : "Register New Prep-Servant Intern"}</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600 font-arabic">
                {isRtl ? "اسم الطالب بالكامل" : "Intern Full Name"} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newInternName}
                onChange={(e) => setNewInternName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-arabic"
                placeholder={isRtl ? "مثال: مينا أمير عبد القدوس" : "e.g. Mina Amir"}
              />
            </div>

            {/* Google Drive Photo ID */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600 font-arabic">
                {isRtl ? "معرف الصورة على Google Drive" : "Google Drive Photo ID"}
              </label>
              <input
                type="text"
                value={newInternPhotoId}
                onChange={(e) => setNewInternPhotoId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-mono"
                placeholder="11mMRtDGITY-Y1zs..."
              />
            </div>

            {/* Main Dept */}
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-600 font-arabic">
                  {isRtl ? "قسم الخدمة الأساسي (Main Rotation)" : "Primary Department"} <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const name = prompt(isRtl ? "أدخل اسم القسم الأساسي الجديد:" : "Enter new primary department name:");
                    if (name && name.trim()) {
                      const trimmed = name.trim();
                      if (mainDepartments.includes(trimmed)) {
                        alert(isRtl ? "هذا القسم موجود بالفعل!" : "This department already exists!");
                        return;
                      }
                      const updatedMain = [...mainDepartments, trimmed];
                      onUpdateDepartments(updatedMain, secondaryDepartments);
                      setNewInternMainDept(trimmed);
                    }
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold font-arabic flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isRtl ? "إضافة قسم" : "Add Dept"}</span>
                </button>
              </div>
              <select
                required
                value={newInternMainDept}
                onChange={(e) => setNewInternMainDept(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-arabic cursor-pointer"
              >
                <option value="">{isRtl ? "-- اختر قسم الخدمة --" : "-- Select Department --"}</option>
                {mainDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Dept */}
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-600 font-arabic">
                  {isRtl ? "الخدمة الفرعية (Secondary Rotation)" : "Secondary Department"}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const name = prompt(isRtl ? "أدخل اسم الخدمة الفرعية الجديدة:" : "Enter new secondary service name:");
                    if (name && name.trim()) {
                      const trimmed = name.trim();
                      if (secondaryDepartments.includes(trimmed)) {
                        alert(isRtl ? "هذه الخدمة موجودة بالفعل!" : "This service already exists!");
                        return;
                      }
                      const updatedSec = [...secondaryDepartments, trimmed];
                      onUpdateDepartments(mainDepartments, updatedSec);
                      setNewInternSecDept(trimmed);
                    }
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold font-arabic flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isRtl ? "إضافة خدمة" : "Add Service"}</span>
                </button>
              </div>
              <select
                value={newInternSecDept}
                onChange={(e) => setNewInternSecDept(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-arabic cursor-pointer"
              >
                <option value="">{isRtl ? "-- بدون خدمة فرعية --" : "-- No Secondary (Clear) --"}</option>
                {secondaryDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewInternName("");
                setNewInternMainDept("");
                setNewInternSecDept("");
                setNewInternPhotoId("");
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {isRtl ? "إضافة وتسجيل" : "Register Intern"}
            </button>
          </div>
        </form>
      )}

      {/* Bulk Edit Panel */}
      {anySelected && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-6 shadow-sm animate-scale-up" dir={isRtl ? "rtl" : "ltr"}>
          <div className="flex flex-col gap-4">
            <div className={`flex justify-between items-center ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm font-arabic">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <span>
                  {isRtl 
                    ? `تم تحديد ${selectedNames.length} طالب للتعديل الجماعي` 
                    : `Selected ${selectedNames.length} intern(s) for bulk edit`}
                </span>
              </div>
              <button
                onClick={handleClearSelection}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-arabic font-semibold underline cursor-pointer"
              >
                {isRtl ? "إلغاء التحديد" : "Clear Selection"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Bulk Main Department */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer font-arabic">
                    <input
                      type="checkbox"
                      checked={updateMainActive}
                      onChange={(e) => setUpdateMainActive(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span>{isRtl ? "تعديل القسم الأساسي" : "Update Primary Department"}</span>
                  </label>
                  {updateMainActive && (
                    <button
                      type="button"
                      onClick={() => {
                        const name = prompt(isRtl ? "أدخل اسم القسم الأساسي الجديد:" : "Enter new primary department name:");
                        if (name && name.trim()) {
                          const trimmed = name.trim();
                          if (mainDepartments.includes(trimmed)) {
                            alert(isRtl ? "هذا القسم موجود بالفعل!" : "This department already exists!");
                            return;
                          }
                          const updatedMain = [...mainDepartments, trimmed];
                          onUpdateDepartments(updatedMain, secondaryDepartments);
                          setBulkMainDept(trimmed);
                        }
                      }}
                      className="text-[9px] text-indigo-600 hover:text-indigo-800 font-semibold font-arabic flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>{isRtl ? "إضافة قسم" : "Add Dept"}</span>
                    </button>
                  )}
                </div>
                <select
                  disabled={!updateMainActive}
                  value={bulkMainDept}
                  onChange={(e) => setBulkMainDept(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-arabic disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                >
                  <option value="">{isRtl ? "-- اختر القسم الأساسي --" : "-- Select Primary Department --"}</option>
                  {mainDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulk Secondary Department */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer font-arabic">
                    <input
                      type="checkbox"
                      checked={updateSecActive}
                      onChange={(e) => setUpdateSecActive(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span>{isRtl ? "تعديل القسم الفرعي" : "Update Secondary Department"}</span>
                  </label>
                  {updateSecActive && (
                    <button
                      type="button"
                      onClick={() => {
                        const name = prompt(isRtl ? "أدخل اسم الخدمة الفرعية الجديدة:" : "Enter new secondary service name:");
                        if (name && name.trim()) {
                          const trimmed = name.trim();
                          if (secondaryDepartments.includes(trimmed)) {
                            alert(isRtl ? "هذه الخدمة موجودة بالفعل!" : "This service already exists!");
                            return;
                          }
                          const updatedSec = [...secondaryDepartments, trimmed];
                          onUpdateDepartments(mainDepartments, updatedSec);
                          setBulkSecDept(trimmed);
                        }
                      }}
                      className="text-[9px] text-indigo-600 hover:text-indigo-800 font-semibold font-arabic flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>{isRtl ? "إضافة خدمة" : "Add Service"}</span>
                    </button>
                  )}
                </div>
                <select
                  disabled={!updateSecActive}
                  value={bulkSecDept}
                  onChange={(e) => setBulkSecDept(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-arabic disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                >
                  <option value="">{isRtl ? "-- بدون خدمة فرعية --" : "-- No Secondary (Clear) --"}</option>
                  {secondaryDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100 mt-2">
              <button
                type="button"
                onClick={handleApplyBulk}
                disabled={!updateMainActive && !updateSecActive}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-arabic font-bold shadow-md shadow-indigo-600/10 transition-all cursor-pointer disabled:shadow-none"
              >
                {isRtl ? "تطبيق التعديل الجماعي" : "Apply Bulk Edit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6" dir={isRtl ? "rtl" : "ltr"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-arabic transition-all ${
                isRtl ? "pr-11 pl-4" : "pl-11 pr-4"
              }`}
            />
            <div className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
              isRtl ? "right-0 pr-4" : "left-0 pl-4"
            }`}>
              <Search className="w-5 h-5" />
            </div>
          </div>

          {/* Department Filter (Lists all unique departments) */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-arabic appearance-none transition-all cursor-pointer ${
                isRtl ? "pr-11 pl-10" : "pl-11 pr-10"
              }`}
            >
              <option value="">{isRtl ? "كل الأقسام" : "All Departments"}</option>
              {/* Combine primary & secondary in filtering */}
              {Array.from(new Set([...mainDepartments, ...secondaryDepartments])).sort((a, b) => a.localeCompare(b, lang)).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <div className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
              isRtl ? "right-0 pr-4" : "left-0 pl-4"
            }`}>
              <Filter className="w-5 h-5" />
            </div>
            {/* Dropdown arrow */}
            <div className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${
              isRtl ? "left-0 pl-4" : "right-0 pr-4"
            }`}>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full font-arabic text-sm" dir={isRtl ? "rtl" : "ltr"}>
            <thead className="bg-slate-50 border-b border-slate-200/80 text-xs text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3.5 text-center w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className={`px-4 py-3.5 ${isRtl ? "text-right" : "text-left"}`}>{t.tableIntern}</th>
                <th className={`px-6 py-3.5 ${isRtl ? "text-right" : "text-left"}`}>{t.primaryDept}</th>
                <th className={`px-6 py-3.5 ${isRtl ? "text-right" : "text-left"}`}>{t.secondaryDept}</th>
                <th className="px-6 py-3.5 text-center w-28">{isRtl ? "الخيارات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInterns.map((intern) => {
                const isEditing = editingName === intern.intern_name;
                const isSelected = selectedNames.includes(intern.intern_name);

                return (
                  <tr 
                    key={intern.intern_name} 
                    className={`transition-colors ${
                      isSelected ? "bg-indigo-50/20" : "hover:bg-slate-50/40"
                    }`}
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(intern.intern_name, e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-200/60 flex items-center justify-center">
                          <InternImage
                            internName={intern.intern_name}
                            drivePhotoId={intern.drive_photo_id}
                            className="w-full h-full"
                            initialsClassName="text-[10px]"
                          />
                        </div>
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editInternName}
                              onChange={(e) => setEditInternName(e.target.value)}
                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                            />
                            <input
                              type="text"
                              placeholder="Drive Photo ID"
                              value={editDrivePhotoId}
                              onChange={(e) => setEditDrivePhotoId(e.target.value)}
                              className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[10px] w-full font-mono"
                            />
                          </div>
                        ) : (
                          <span className="font-arabic">{intern.intern_name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-1 w-full max-w-[200px]">
                          <select
                            value={editMainDept}
                            onChange={(e) => setEditMainDept(e.target.value)}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-slate-700 w-full"
                          >
                            {mainDepartments.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const name = prompt(isRtl ? "أدخل اسم القسم الأساسي الجديد:" : "Enter new primary department name:");
                              if (name && name.trim()) {
                                const trimmed = name.trim();
                                if (mainDepartments.includes(trimmed)) {
                                  alert(isRtl ? "هذا القسم موجود بالفعل!" : "This department already exists!");
                                  return;
                                }
                                const updatedMain = [...mainDepartments, trimmed];
                                onUpdateDepartments(updatedMain, secondaryDepartments);
                                setEditMainDept(trimmed);
                              }
                            }}
                            className="text-[9px] text-indigo-600 hover:text-indigo-800 font-semibold font-arabic self-start flex items-center gap-0.5"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>{isRtl ? "إضافة قسم" : "Add Dept"}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                          <Layers className="w-3.5 h-3.5" />
                          {intern.main_department}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-1 w-full max-w-[200px]">
                          <select
                            value={editSecDept}
                            onChange={(e) => setEditSecDept(e.target.value)}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-slate-700 w-full"
                          >
                            <option value="">{isRtl ? "-- بدون خدمة فرعية --" : "-- No Secondary --"}</option>
                            {secondaryDepartments.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const name = prompt(isRtl ? "أدخل اسم الخدمة الفرعية الجديدة:" : "Enter new secondary service name:");
                              if (name && name.trim()) {
                                const trimmed = name.trim();
                                if (secondaryDepartments.includes(trimmed)) {
                                  alert(isRtl ? "هذه الخدمة موجودة بالفعل!" : "This service already exists!");
                                  return;
                                }
                                const updatedSec = [...secondaryDepartments, trimmed];
                                onUpdateDepartments(mainDepartments, updatedSec);
                                setEditSecDept(trimmed);
                              }
                            }}
                            className="text-[9px] text-indigo-600 hover:text-indigo-800 font-semibold font-arabic self-start flex items-center gap-0.5"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>{isRtl ? "إضافة خدمة" : "Add Service"}</span>
                          </button>
                        </div>
                      ) : intern.secondary_department ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                          {intern.secondary_department}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs font-light">{isRtl ? "لا يوجد" : "None"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(intern.intern_name)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(intern)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all cursor-pointer"
                            title={isRtl ? "تعديل" : "Edit"}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInternClick(intern.intern_name)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all cursor-pointer"
                            title={isRtl ? "حذف الطالب" : "Delete Intern"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Select All Header */}
      {filteredInterns.length > 0 && (
        <div className="md:hidden bg-slate-100/60 border border-slate-200/40 rounded-2xl p-4 flex items-center justify-between text-xs" dir={isRtl ? "rtl" : "ltr"}>
          <label className="flex items-center gap-2 font-arabic font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <span>{isRtl ? "تحديد الكل" : "Select All"}</span>
          </label>
          <span className="text-slate-400 font-mono font-medium">{selectedNames.length} / {filteredInterns.length}</span>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredInterns.map((intern) => {
          const isEditing = editingName === intern.intern_name;
          const isSelected = selectedNames.includes(intern.intern_name);

          return (
            <div
              key={intern.intern_name}
              className={`bg-white rounded-3xl border p-5 shadow-sm transition-all space-y-4 ${
                isSelected ? "border-indigo-500 ring-1 ring-indigo-500/20" : "border-slate-200/60"
              }`}
            >
              {/* Card Header: Checkbox & Name/Photo */}
              <div className="flex items-start justify-between gap-3" dir={isRtl ? "rtl" : "ltr"}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectRow(intern.intern_name, e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-200/60 flex items-center justify-center">
                    <InternImage
                      internName={intern.intern_name}
                      drivePhotoId={intern.drive_photo_id}
                      className="w-full h-full"
                      initialsClassName="text-xs"
                    />
                  </div>

                  {isEditing ? (
                    <div className="space-y-1.5 flex-1">
                      <input
                        type="text"
                        value={editInternName}
                        onChange={(e) => setEditInternName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                        placeholder={isRtl ? "الاسم..." : "Name..."}
                      />
                      <input
                        type="text"
                        placeholder="Drive Photo ID"
                        value={editDrivePhotoId}
                        onChange={(e) => setEditDrivePhotoId(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[10px] font-mono"
                      />
                    </div>
                  ) : (
                    <span className="font-arabic font-bold text-slate-800 text-sm">{intern.intern_name}</span>
                  )}
                </div>

                {/* Actions */}
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSaveEdit(intern.intern_name)}
                        className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(intern)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all cursor-pointer"
                        title={isRtl ? "تعديل" : "Edit"}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInternClick(intern.intern_name)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all cursor-pointer"
                        title={isRtl ? "حذف الطالب" : "Delete Intern"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body: Departments */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5" dir={isRtl ? "rtl" : "ltr"}>
                {/* Primary Department */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-arabic">{t.primaryDept}:</span>
                  {isEditing ? (
                    <div className="flex flex-col gap-1 w-full max-w-[200px]">
                      <select
                        value={editMainDept}
                        onChange={(e) => setEditMainDept(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 w-full"
                      >
                        {mainDepartments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const name = prompt(isRtl ? "أدخل اسم القسم الأساسي الجديد:" : "Enter new primary department name:");
                          if (name && name.trim()) {
                            const trimmed = name.trim();
                            if (mainDepartments.includes(trimmed)) {
                              alert(isRtl ? "هذا القسم موجود بالفعل!" : "This department already exists!");
                              return;
                            }
                            const updatedMain = [...mainDepartments, trimmed];
                            onUpdateDepartments(updatedMain, secondaryDepartments);
                            setEditMainDept(trimmed);
                          }
                        }}
                        className="text-[9px] text-indigo-600 hover:text-indigo-800 font-semibold font-arabic self-start flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{isRtl ? "إضافة قسم" : "Add Dept"}</span>
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold font-arabic">
                      <Layers className="w-3.5 h-3.5" />
                      {intern.main_department}
                    </span>
                  )}
                </div>

                {/* Secondary Department */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-arabic">{t.secondaryDept}:</span>
                  {isEditing ? (
                    <div className="flex flex-col gap-1 w-full max-w-[200px]">
                      <select
                        value={editSecDept}
                        onChange={(e) => setEditSecDept(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 w-full"
                      >
                        <option value="">{isRtl ? "-- بدون خدمة فرعية --" : "-- No Secondary --"}</option>
                        {secondaryDepartments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const name = prompt(isRtl ? "أدخل اسم الخدمة الفرعية الجديدة:" : "Enter new secondary service name:");
                          if (name && name.trim()) {
                            const trimmed = name.trim();
                            if (secondaryDepartments.includes(trimmed)) {
                              alert(isRtl ? "هذه الخدمة موجودة بالفعل!" : "This service already exists!");
                              return;
                            }
                            const updatedSec = [...secondaryDepartments, trimmed];
                            onUpdateDepartments(mainDepartments, updatedSec);
                            setEditSecDept(trimmed);
                          }
                        }}
                        className="text-[9px] text-indigo-600 hover:text-indigo-800 font-semibold font-arabic self-start flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{isRtl ? "إضافة خدمة" : "Add Service"}</span>
                      </button>
                    </div>
                  ) : intern.secondary_department ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium font-arabic">
                      {intern.secondary_department}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-xs font-light font-arabic">{isRtl ? "لا يوجد" : "None"}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Local Storage Alert */}
      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-arabic leading-relaxed text-right" dir={isRtl ? "rtl" : "ltr"}>
        <p className="font-bold mb-1">
          {isRtl ? "💡 ملاحظة حول تعديل البيانات وإدارة قاعدة البيانات:" : "💡 Database Modification Notice:"}
        </p>
        <p className="font-light">
          {isRtl 
            ? "التعديلات والإضافات التي تقوم بها هنا تُحفظ محلياً في متصفحك بشكل فوري. وإذا قمت بتهيئة رابط Google Sheets، فسيتم إرسال قاعدة البيانات المحدثة بالكامل إلى شيت 'Department_Rotations' و 'Departments' تلقائياً لتظل متزامنة عبر جميع الهواتف والأجهزة الخاصة بأمناء الخدمة."
            : "Modifications made here are cached locally in real-time. When connected to Google Sheets, the updated database will automatically rewrite the 'Department_Rotations' and 'Departments' sheets so everything stays fully synced across all devices."}
        </p>
      </div>

    </div>
  );
}
