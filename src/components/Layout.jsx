import React from "react";
import { ClipboardList, LayoutDashboard, Globe, Users } from "lucide-react";
import { translations } from "../translations";

export default function Layout({ 
  children, 
  activeTab, 
  setActiveTab, 
  lang, 
  toggleLang,
  isAdminMode = false 
}) {
  const t = translations[lang];
  const isRtl = lang === "ar";

  const tabs = [
    { id: "wizard", name: t.wizardTab, icon: ClipboardList },
    { id: "dashboard", name: t.dashboardTab, icon: LayoutDashboard },
    { id: "interns", name: lang === "ar" ? "بيانات الطلاب" : "Manage Interns", icon: Users }
  ];

  return (
    <div 
      className={`min-h-screen flex bg-slate-50 text-slate-900 font-sans transition-all duration-300 ${
        isAdminMode ? "flex-col md:flex-row" : "flex-col"
      }`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Desktop Sidebar (Only visible in Admin Mode) */}
      {isAdminMode && (
        <aside className={`hidden md:flex md:w-64 flex-col bg-slate-900 text-slate-100 shadow-xl z-20 ${
          isRtl ? "border-l border-slate-800" : "border-r border-slate-800"
        }`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="bg-indigo-600 px-2 py-1 rounded text-white text-sm">E3</span>
              <div className={`flex flex-col ${isRtl ? "text-right" : "text-left"}`}>
                <span className="font-semibold text-sm leading-tight text-indigo-400 font-arabic">إعداد خدام</span>
                <span className="text-[9px] text-slate-400 font-light">Performance System</span>
              </div>
            </h1>
          </div>

          {/* Sidebar Nav */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group gap-3 ${
                    isRtl ? "text-right" : "text-left"
                  } ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-medium"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                  <span className="font-arabic text-sm flex-1">{tab.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Language Toggle */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40">
            <button
              onClick={toggleLang}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>{lang === "ar" ? "English" : "العربية"}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-light">
                {lang === "ar" ? "Change Lang" : "تغيير اللغة"}
              </span>
            </button>
          </div>
        </aside>
      )}

      {/* Header Bar: Shown as Mobile Header in Admin, or Top Header in Responder Mode */}
      <header className={`flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-md z-20 ${
        isAdminMode ? "md:hidden" : "w-full"
      }`}>
        <div className="flex items-center gap-2">
          <span className="bg-indigo-600 text-white font-bold px-2 py-1 rounded text-sm">E3</span>
          <span className="font-arabic font-semibold text-sm">{t.title}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Responder Mode Label */}
          {!isAdminMode && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 font-arabic">
              {lang === "ar" ? "استمارة التقييم فقط" : "Evaluation Form Only"}
            </span>
          )}

          {/* Language Button */}
          <button
            onClick={toggleLang}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            title={lang === "ar" ? "English" : "العربية"}
          >
            <Globe className="w-4.5 h-4.5 text-indigo-400" />
            <span className="hidden sm:inline text-xs text-slate-300">{lang === "ar" ? "English" : "العربية"}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col p-4 md:p-8 overflow-y-auto ${
        isAdminMode ? "pb-24 md:pb-8" : "w-full max-w-4xl mx-auto py-12"
      }`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Only visible in Admin Mode) */}
      {isAdminMode && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around py-3 px-4 shadow-2xl z-30">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
                  isActive ? "text-indigo-400" : "text-slate-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-arabic text-[10px] font-medium leading-none mt-1">{tab.name}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
