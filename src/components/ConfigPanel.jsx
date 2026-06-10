import React, { useState } from "react";
import { Database, Code, CheckCircle, AlertCircle, Copy, Info, Check, RefreshCw, Share2 } from "lucide-react";
import { testApiConnection, getGoogleSheetsUrl, setGoogleSheetsUrl } from "../api";
import { resetToDefaults } from "../mockData";
import { translations } from "../translations";

export default function ConfigPanel({ onApiUrlChange, onDataReset, lang }) {
  const t = translations[lang];
  const isRtl = lang === "ar";

  const [apiUrl, setApiUrl] = useState(getGoogleSheetsUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);

  const getResponderUrl = () => {
    return window.location.origin + window.location.pathname;
  };

  const getAdminUrl = () => {
    return window.location.origin + window.location.pathname + "?mode=admin";
  };

  const copyUrl = (url, type) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleSaveUrl = (e) => {
    e.preventDefault();
    setGoogleSheetsUrl(apiUrl.trim());
    onApiUrlChange();
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!apiUrl.trim()) {
      setTestResult({ success: false, message: isRtl ? "من فضلك أدخل رابط الخدمة أولاً" : "Please enter URL first" });
      return;
    }

    setTesting(true);
    setTestResult(null);
    const result = await testApiConnection(apiUrl.trim());
    setTesting(false);

    if (result.success) {
      setTestResult({
        success: true,
        message: t.configSuccessSub
          .replace("{rotations}", result.data.rotations.length)
          .replace("{evaluations}", result.data.evaluations.length)
      });
      setGoogleSheetsUrl(apiUrl.trim());
      onApiUrlChange();
    } else {
      setTestResult({
        success: false,
        message: t.configErrorSub.replace("{error}", result.error)
      });
    }
  };

  const handleResetData = () => {
    if (window.confirm(t.configResetConfirm)) {
      resetToDefaults();
      onDataReset();
      setApiUrl("");
      setTestResult({ success: true, message: isRtl ? "تمت إعادة ضبط قاعدة البيانات المحلية للقيم الافتراضية بنجاح." : "Local database seeded defaults successfully." });
    }
  };

  const copyScriptCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 ${
      isRtl ? "text-right" : "text-left"
    } animate-fade-in`}>

      {/* Share Links Panel */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 md:p-8">
        <div className={`flex items-center gap-3 border-b border-slate-100 pb-4 mb-6 ${
          isRtl ? "flex-row" : "flex-row-reverse"
        }`} dir={isRtl ? "rtl" : "ltr"}>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-inner flex-shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-arabic text-slate-800">
              {isRtl ? "روابط مشاركة التطبيق" : "Application Access Links"}
            </h2>
            <p className="text-[10px] text-slate-400 font-light">
              {isRtl ? "روابط منفصلة للمقيّمين ولوحة التحكم الإدارية" : "Separate URLs for evaluators and administrators"}
            </p>
          </div>
        </div>

        <div className="space-y-4 font-arabic" dir={isRtl ? "rtl" : "ltr"}>
          {/* Responder URL */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className={`space-y-1 ${isRtl ? "text-right" : "text-left"}`}>
              <span className="text-xs font-bold text-slate-700 block">
                {isRtl ? "رابط المقيّمين (استمارة التقييم فقط)" : "Responder Link (Evaluation Form Only)"}
              </span>
              <span className="text-[10px] text-slate-400 block font-light leading-relaxed">
                {isRtl 
                  ? "شارك هذا الرابط مع أمناء الأقسام والخادم المقيّم. لا يمكنهم من خلاله رؤية البيانات أو لوحة التحكم."
                  : "Share this link with department heads/evaluators. They cannot see analytics or manage data."}
              </span>
            </div>
            <button
              onClick={() => copyUrl(getResponderUrl(), "responder")}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
            >
              {copiedLink === "responder" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink === "responder" ? t.configCopied : (isRtl ? "نسخ الرابط" : "Copy Link")}</span>
            </button>
          </div>

          {/* Admin URL */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className={`space-y-1 ${isRtl ? "text-right" : "text-left"}`}>
              <span className="text-xs font-bold text-slate-700 block">
                {isRtl ? "رابط لوحة التحكم للمشرفين (كامل الصلاحيات)" : "Admin Dashboard Link (Full Access)"}
              </span>
              <span className="text-[10px] text-slate-400 block font-light leading-relaxed">
                {isRtl 
                  ? "رابط لوحة التحكم الرئيسي لعرض التحليلات، وإدارة الطلاب، والربط مع Google Sheets."
                  : "Access dashboard analytics, roster adjustments, and Google Sheets integration settings."}
              </span>
            </div>
            <button
              onClick={() => copyUrl(getAdminUrl(), "admin")}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
            >
              {copiedLink === "admin" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink === "admin" ? t.configCopied : (isRtl ? "نسخ الرابط" : "Copy Link")}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Configuration Inputs */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 md:p-8">
        <div className={`flex items-center gap-3 border-b border-slate-100 pb-4 mb-6 ${
          isRtl ? "flex-row" : "flex-row-reverse"
        }`} dir={isRtl ? "rtl" : "ltr"}>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-inner flex-shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-arabic text-slate-800">{t.configTitle}</h2>
            <p className="text-[10px] text-slate-400 font-light">{t.configSub}</p>
          </div>
        </div>

        <form onSubmit={handleSaveUrl} className="space-y-6 font-arabic" dir={isRtl ? "rtl" : "ltr"}>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              {t.configUrlLabel}
            </label>
            <div className={`flex flex-col sm:flex-row gap-2 ${isRtl ? "" : "flex-row-reverse"}`}>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-700 font-mono text-xs select-all text-left"
                dir="ltr"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-5 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-2xl font-semibold text-xs md:text-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  <span>{t.configTestBtn}</span>
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs md:text-sm shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  {t.configSaveBtn}
                </button>
              </div>
            </div>
            <p className={`text-[10px] text-slate-400 font-light leading-relaxed ${isRtl ? "text-right" : "text-left"}`}>
              {t.configFallbackTip}
            </p>
          </div>
        </form>

        {/* Test Connection Result Alert */}
        {testResult && (
          <div className={`mt-6 p-4 rounded-2xl text-xs flex items-start gap-3 border ${
            testResult.success 
              ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
              : "bg-rose-50 text-rose-800 border-rose-100"
          }`} dir={isRtl ? "rtl" : "ltr"}>
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            )}
            <div className={`space-y-1 ${isRtl ? "text-right" : "text-left"}`}>
              <span className="font-bold block">{testResult.success ? t.configSuccessTitle : t.configErrorTitle}</span>
              <span className="font-light leading-relaxed block">{testResult.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Deployment Instructions & Code Copy */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 md:p-8">
        <div className={`flex items-center justify-between border-b border-slate-100 pb-4 mb-6 ${
          isRtl ? "flex-row" : "flex-row-reverse"
        }`} dir={isRtl ? "rtl" : "ltr"}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-100 shadow-inner flex-shrink-0">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-arabic text-slate-800">{t.configAppScriptTitle}</h2>
              <p className="text-[10px] text-slate-400 font-light font-sans">{t.configAppScriptSub}</p>
            </div>
          </div>
          <button
            onClick={copyScriptCode}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-arabic font-semibold transition-all cursor-pointer whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600">{t.configCopied}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>{t.configCopyBtn}</span>
              </>
            )}
          </button>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 font-arabic text-xs md:text-sm text-slate-600 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-200/50" dir={isRtl ? "rtl" : "ltr"}>
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-indigo-500" />
            <span>{t.configInstructionsTitle}</span>
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 leading-relaxed pr-1 font-light">
            {t.configInstructionsList.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Script Code Container */}
        <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-900">
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-950 flex justify-between items-center text-[10px] text-slate-400 font-mono" dir="ltr">
            <span>Code.gs</span>
            <span>Google Apps Script</span>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto text-left select-all max-h-[300px] leading-relaxed" dir="ltr">
            {APPS_SCRIPT_CODE}
          </pre>
        </div>
      </div>

      {/* Local DB Reset Action */}
      <div className={`bg-slate-100 rounded-3xl border border-slate-200/80 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
        isRtl ? "text-right" : "text-left"
      }`}>
        <div className="space-y-1 font-arabic" dir={isRtl ? "rtl" : "ltr"}>
          <h4 className="text-sm font-bold text-rose-800">{t.configResetTitle}</h4>
          <p className="text-[11px] text-slate-500 font-light leading-relaxed">
            {t.configResetSub}
          </p>
        </div>
        <button
          onClick={handleResetData}
          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-700 px-5 py-3 rounded-2xl font-arabic font-semibold text-xs md:text-sm transition-all cursor-pointer whitespace-nowrap"
        >
          {t.configResetBtn}
        </button>
      </div>

    </div>
  );
}

const APPS_SCRIPT_CODE = `/**
 * Google Apps Script Web App Endpoint for Intern Performance Tracking System
 * Deploy this script as a "Web App" execution: "Me", Access: "Anyone".
 */

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'getData') {
    var rotationsSheet = ss.getSheetByName('Department_Rotations');
    var evaluationsSheet = ss.getSheetByName('Evaluations_Log');
    var departmentsSheet = ss.getSheetByName('Departments');
    
    var rotationsData = [];
    if (rotationsSheet) {
      var rotationsRows = rotationsSheet.getDataRange().getValues();
      var headers = rotationsRows[0];
      for (var i = 1; i < rotationsRows.length; i++) {
        var row = rotationsRows[i];
        var item = {};
        for (var j = 0; j < headers.length; j++) {
          var headerName = headers[j].toString().trim();
          item[headerName] = row[j];
        }
        rotationsData.push(item);
      }
    }
    
    var evaluationsData = [];
    if (evaluationsSheet) {
      var evaluationsRows = evaluationsSheet.getDataRange().getValues();
      var headers = evaluationsRows[0];
      for (var i = 1; i < evaluationsRows.length; i++) {
        var row = evaluationsRows[i];
        var item = {};
        for (var j = 0; j < headers.length; j++) {
          var headerName = headers[j].toString().trim();
          // Convert date values safely to ISO strings for JSON transmission
          if (row[j] instanceof Date) {
            item[headerName] = row[j].toISOString();
          } else {
            item[headerName] = row[j];
          }
        }
        evaluationsData.push(item);
      }
    }
    
    var departmentsData = null;
    if (departmentsSheet) {
      var deptRows = departmentsSheet.getDataRange().getValues();
      var mainDepts = [];
      var secDepts = [];
      for (var i = 0; i < deptRows.length; i++) {
        if (deptRows[i][0]) {
          var val = deptRows[i][0].toString().trim();
          if (val) mainDepts.push(val);
        }
        if (deptRows[i][1]) {
          var val = deptRows[i][1].toString().trim();
          if (val) secDepts.push(val);
        }
      }
      departmentsData = {
        main: mainDepts,
        secondary: secDepts
      };
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      rotations: rotationsData,
      evaluations: evaluationsData,
      departments: departmentsData
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action parameter' }))
     .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'submitEvaluations') {
      var evaluationsSheet = ss.getSheetByName('Evaluations_Log');
      
      // If table doesn't exist, create it dynamically with proper schema headers
      if (!evaluationsSheet) {
        evaluationsSheet = ss.insertSheet('Evaluations_Log');
        evaluationsSheet.appendRow([
          'timestamp', 'evaluator_name', 'department', 'intern_name', 
          'attendance', 'commitment_time', 'church_spirit_appearance', 
          'lesson_preparation', 'target_audience_handling', 'strengths', 
          'areas_of_improvement', 'notes'
        ]);
      }
      
      var data = postData.data; // Array of evaluation objects
      for (var i = 0; i < data.length; i++) {
        var ev = data[i];
        
        // Append row matching column ordering
        evaluationsSheet.appendRow([
          ev.timestamp || new Date().toISOString(),
          ev.evaluator_name || '',
          ev.department || '',
          ev.intern_name || '',
          ev.attendance || 0,
          ev.commitment_time || 0,
          ev.church_spirit_appearance || 0,
          ev.lesson_preparation || 0,
          ev.target_audience_handling || 0,
          ev.strengths || '',
          ev.areas_of_improvement || '',
          ev.notes || ''
        ]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: data.length }))
         .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'saveRotations') {
      var rotationsSheet = ss.getSheetByName('Department_Rotations');
      if (!rotationsSheet) {
        rotationsSheet = ss.insertSheet('Department_Rotations');
      }
      rotationsSheet.clearContents();
      rotationsSheet.appendRow(['Main Department', 'Secondary Department', 'Intern Name', 'Intern Photo ID']);
      
      var data = postData.data || [];
      var rows = [];
      for (var i = 0; i < data.length; i++) {
        var r = data[i];
        rows.push([
          r.main_department || '',
          r.secondary_department || '',
          r.intern_name || '',
          r.drive_photo_id || ''
        ]);
      }
      if (rows.length > 0) {
        rotationsSheet.getRange(2, 1, rows.length, 4).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
         .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'saveDepartments') {
      var departmentsSheet = ss.getSheetByName('Departments');
      if (!departmentsSheet) {
        departmentsSheet = ss.insertSheet('Departments');
      }
      departmentsSheet.clearContents();
      
      var mainDepts = postData.main || [];
      var secDepts = postData.secondary || [];
      var maxLen = Math.max(mainDepts.length, secDepts.length);
      
      var rows = [];
      for (var i = 0; i < maxLen; i++) {
        rows.push([mainDepts[i] || '', secDepts[i] || '']);
      }
      if (rows.length > 0) {
        departmentsSheet.getRange(1, 1, rows.length, 2).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
         .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action parameter' }))
       .setMimeType(ContentService.MimeType.JSON);
       
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
       .setMimeType(ContentService.MimeType.JSON);
  }
}`;
