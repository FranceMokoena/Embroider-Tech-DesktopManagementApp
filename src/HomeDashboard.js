import React, { useEffect, useState, useMemo } from 'react';
import './HomeDashboard.css';
import jsPDF from 'jspdf';

// Debug jsPDF import
console.log('🔍 jsPDF imported:', typeof jsPDF);

const DESKTOP_API = process.env.REACT_APP_DESKTOP_API || 'http://localhost:5001';

function HomeDashboard() {
  const [token, setToken] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [scanStats, setScanStats] = useState({
    totalScans: 0,
    reparable: 0,
    beyondRepair: 0,
    healthy: 0
  });
  const [dashboardOverview, setDashboardOverview] = useState({
    totalUsers: 0,
    totalSessions: 0,
    totalScans: 0,
    todayScans: 0,
    weeklyScans: 0
  });
  const [departmentStats, setDepartmentStats] = useState({});
  const [scanHistory, setScanHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterTechnician, setFilterTechnician] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [selectedNotificationView, setSelectedNotificationView] = useState(null);
  const [notificationsViewed, setNotificationsViewed] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedScanForExport, setSelectedScanForExport] = useState(null);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionExportModalOpen, setSessionExportModalOpen] = useState(false);
  const [selectedSessionForExport, setSelectedSessionForExport] = useState(null);
  
  // Filter states for sessions
  const [sessionFilters, setSessionFilters] = useState({
    technician: '',
    day: '',
    department: ''
  });
  
  // Filter states for scan history (keeping existing structure)
  const [scanHistoryFilters, setScanHistoryFilters] = useState({
    technician: '',
    department: '',
    status: ''
  });
  
  // Filter states for technician management
  const [technicianFilters, setTechnicianFilters] = useState({
    search: '',
    department: ''
  });


  const toggleSidebar = () => {
    console.log('Toggling sidebar from:', sidebarOpen, 'to:', !sidebarOpen);
    setSidebarOpen(!sidebarOpen);
  };
  const handleLogout = () => {
    // Clear authentication token
    localStorage.removeItem('authToken');
    // Redirect to admin login
    window.location.href = '/admin-login';
  };

  // Generate and download PDF report for a specific scan
  const generatePDFReport = (scan) => {
    try {
      // Create new PDF document
      const pdf = new jsPDF();
      
      // Set font
      pdf.setFont('helvetica');
      
      // Add header with company logo box
      pdf.setFillColor(44, 62, 80);
      pdf.rect(20, 15, 170, 25, 'F');
      
      // Company name in header
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text('EMBROIDERYTECH', 105, 28, { align: 'center' });
      
      // Report title
      pdf.setFontSize(14);
      pdf.text('Screen Scan Report', 105, 38, { align: 'center' });
      
      // Reset text color for body
      pdf.setTextColor(44, 62, 80);
      
      // Add generation date
      pdf.setFontSize(10);
      pdf.setTextColor(127, 140, 141);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 105, 50, { align: 'center' });
      
      // Add line separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 60, 190, 60);
      
      // Add scan details in a professional table format
      pdf.setFontSize(12);
      pdf.setTextColor(44, 62, 80);
      
      let yPosition = 80;
      const lineHeight = 12;
      const labelX = 25;
      const valueX = 80;
      
      // Create a background box for the details
      pdf.setFillColor(248, 249, 250);
      pdf.rect(20, 70, 170, 100, 'F');
      
      // Barcode
      pdf.setFont('helvetica', 'bold');
      pdf.text('Barcode:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(scan.barcode, valueX, yPosition);
      yPosition += lineHeight;
      
      // Status
      pdf.setFont('helvetica', 'bold');
      pdf.text('Status:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      
      // Color code the status
      if (scan.status === 'Healthy') {
        pdf.setTextColor(39, 174, 96);
      } else if (scan.status === 'Reparable') {
        pdf.setTextColor(243, 156, 18);
      } else if (scan.status === 'Beyond Repair') {
        pdf.setTextColor(231, 76, 60);
      }
      pdf.text(scan.status, valueX, yPosition);
      pdf.setTextColor(44, 62, 80);
      yPosition += lineHeight;
      
      // Technician
      pdf.setFont('helvetica', 'bold');
      pdf.text('Technician:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(scan.technician || 'Unknown', valueX, yPosition);
      yPosition += lineHeight;
      
      // Department
      pdf.setFont('helvetica', 'bold');
      pdf.text('Department:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(scan.department || 'Unknown', valueX, yPosition);
      yPosition += lineHeight;
      
      // Scan Time
      pdf.setFont('helvetica', 'bold');
      pdf.text('Scan Time:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(scan.timestamp).toLocaleString(), valueX, yPosition);
      yPosition += lineHeight;
      
      // Scan ID
      pdf.setFont('helvetica', 'bold');
      pdf.text('Scan ID:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(scan._id, valueX, yPosition);
      
      // Add footer with border
      pdf.setFillColor(44, 62, 80);
      pdf.rect(20, 250, 170, 25, 'F');
      
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text('This report was generated by EmbroideryTech Desktop Management System', 105, 260, { align: 'center' });
      pdf.text('For technical support, contact the IT department', 105, 268, { align: 'center' });
      
      // Save the PDF
      const filename = `Scan_Report_${scan.barcode}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      // Show success message
      alert('✅ PDF Report downloaded successfully!');
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('❌ Error generating PDF report. Please try again.');
    }
  };

  // Handle export button click
  const handleExportClick = (scan) => {
    console.log('🔍 Export clicked for scan:', scan);
    setSelectedScanForExport(scan);
    setExportModalOpen(true);
    console.log('🔍 Export modal should be open now');
  };

  // Handle export confirmation
  const handleExportConfirm = () => {
    console.log('🔍 Export confirmed for scan:', selectedScanForExport);
    if (selectedScanForExport) {
      generatePDFReport(selectedScanForExport);
      setExportModalOpen(false);
      setSelectedScanForExport(null);
    }
  };

  // Generate natural language summary for session
  const generateSessionSummary = (session) => {
    const technician = session.technician || 'Unknown Technician';
    const department = session.department || 'Unknown Department';
    const startTime = new Date(session.startTime).toLocaleString();
    const endTime = session.endTime ? new Date(session.endTime).toLocaleString() : null;
    const scanCount = session.scanCount || 0;
    const sessionId = session._id?.slice(-8) || 'Unknown';
    
    let summary = `📋 <strong>Session Summary</strong><br><br>`;
    summary += `👨‍💼 <strong>${technician}</strong> from the <strong>${department}</strong> department `;
    summary += `started a scanning session at <strong>${startTime}</strong>. `;
    summary += `During this session, they scanned <strong>${scanCount} screen${scanCount !== 1 ? 's' : ''}</strong>. `;
    
    if (endTime) {
      summary += `The session ended at <strong>${endTime}</strong>. `;
    } else {
      summary += `The session is still <strong>active</strong>. `;
    }
    
    summary += `<br><br>📊 <strong>Session Details:</strong><br>`;
    summary += `• Session ID: <strong>${sessionId}</strong><br>`;
    summary += `• Status: <strong>${endTime ? '✅ Completed' : '🔄 Active'}</strong><br>`;
    summary += `• Total Scans: <strong>${scanCount}</strong><br>`;
    
    if (endTime) {
      const duration = new Date(endTime) - new Date(session.startTime);
      const minutes = Math.floor(duration / (1000 * 60));
      const seconds = Math.floor((duration % (1000 * 60)) / 1000);
      summary += `• Duration: <strong>${minutes}m ${seconds}s</strong>`;
    }
    
    return summary;
  };

  // Generate and download PDF report for a session
  const generateSessionPDFReport = (session) => {
    try {
      console.log('🔍 Generating session PDF for:', session);
      
      // Validate session data
      if (!session) {
        throw new Error('No session data provided');
      }
      
      if (!session.startTime) {
        throw new Error('Session start time is missing');
      }
      
      // Create new PDF document
      const pdf = new jsPDF();
      
      // Set font
      pdf.setFont('helvetica');
      
      // Add header with company logo box
      pdf.setFillColor(44, 62, 80);
      pdf.rect(20, 15, 170, 25, 'F');
      
      // Company name in header
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text('EMBROIDERYTECH', 105, 28, { align: 'center' });
      
      // Report title
      pdf.setFontSize(14);
      pdf.text('Session Report', 105, 38, { align: 'center' });
      
      // Reset text color for body
      pdf.setTextColor(44, 62, 80);
      
      // Add generation date
      pdf.setFontSize(10);
      pdf.setTextColor(127, 140, 141);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 105, 50, { align: 'center' });
      
      // Add line separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 60, 190, 60);
      
      // Add session details in a professional table format
      pdf.setFontSize(12);
      pdf.setTextColor(44, 62, 80);
      
      let yPosition = 80;
      const lineHeight = 12;
      const labelX = 25;
      const valueX = 80;
      
      // Create a background box for the details
      pdf.setFillColor(248, 249, 250);
      pdf.rect(20, 70, 170, 120, 'F');
      
      // Session ID
      pdf.setFont('helvetica', 'bold');
      pdf.text('Session ID:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(session._id?.slice(-8) || 'Unknown'), valueX, yPosition);
      yPosition += lineHeight;
      
      // Technician
      pdf.setFont('helvetica', 'bold');
      pdf.text('Technician:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(session.technician || 'Unknown'), valueX, yPosition);
      yPosition += lineHeight;
      
      // Department
      pdf.setFont('helvetica', 'bold');
      pdf.text('Department:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(session.department || 'Unknown'), valueX, yPosition);
      yPosition += lineHeight;
      
      // Start Time
      pdf.setFont('helvetica', 'bold');
      pdf.text('Start Time:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(new Date(session.startTime).toLocaleString()), valueX, yPosition);
      yPosition += lineHeight;
      
      // End Time
      pdf.setFont('helvetica', 'bold');
      pdf.text('End Time:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      if (session.endTime) {
        pdf.text(String(new Date(session.endTime).toLocaleString()), valueX, yPosition);
      } else {
        pdf.setTextColor(243, 156, 18);
        pdf.text('Session Active', valueX, yPosition);
        pdf.setTextColor(44, 62, 80);
      }
      yPosition += lineHeight;
      
      // Scan Count
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total Scans:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(session.scanCount || 0), valueX, yPosition);
      yPosition += lineHeight;
      
      // Duration (if session ended)
      if (session.endTime) {
        const duration = new Date(session.endTime) - new Date(session.startTime);
        const minutes = Math.floor(duration / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Duration:', labelX, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${minutes}m ${seconds}s`, valueX, yPosition);
        yPosition += lineHeight;
      }
      
      // Status
      pdf.setFont('helvetica', 'bold');
      pdf.text('Status:', labelX, yPosition);
      pdf.setFont('helvetica', 'normal');
      if (session.endTime) {
        pdf.setTextColor(39, 174, 96);
        pdf.text('Completed', valueX, yPosition);
      } else {
        pdf.setTextColor(243, 156, 18);
        pdf.text('Active', valueX, yPosition);
      }
      pdf.setTextColor(44, 62, 80);
      
      // Add footer with border
      pdf.setFillColor(44, 62, 80);
      pdf.rect(20, 250, 170, 25, 'F');
      
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text('This report was generated by EmbroideryTech Desktop Management System', 105, 260, { align: 'center' });
      pdf.text('For technical support, contact the IT department', 105, 268, { align: 'center' });
      
      // Save the PDF
      const filename = `Session_Report_${session._id?.slice(-8)}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('🔍 Saving PDF with filename:', filename);
      
      try {
        pdf.save(filename);
        // Show success message
        alert('✅ Session PDF Report downloaded successfully!');
      } catch (saveError) {
        console.error('❌ Error saving PDF:', saveError);
        // Fallback: try to save with a simpler filename
        const fallbackFilename = `Session_Report_${Date.now()}.pdf`;
        pdf.save(fallbackFilename);
        alert('✅ Session PDF Report downloaded successfully!');
      }
      
    } catch (error) {
      console.error('❌ Error generating session PDF report:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Session data:', session);
      alert('❌ Error generating session PDF report. Please try again.');
    }
  };

  // Handle session export button click
  const handleSessionExportClick = (session) => {
    setSelectedSessionForExport(session);
    setSessionExportModalOpen(true);
  };

  // Handle session export confirmation
  const handleSessionExportConfirm = () => {
    if (selectedSessionForExport) {
      generateSessionPDFReport(selectedSessionForExport);
      setSessionExportModalOpen(false);
      setSelectedSessionForExport(null);
    }
  };

  // Handle session filter changes
  const handleSessionFilterChange = (filterType, value) => {
    setSessionFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all session filters
  const clearSessionFilters = () => {
    setSessionFilters({
      technician: '',
      day: '',
      department: ''
    });
  };

  // Handle scan history filter changes
  const handleScanHistoryFilterChange = (filterType, value) => {
    setScanHistoryFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all scan history filters
  const clearScanHistoryFilters = () => {
    setScanHistoryFilters({
      technician: '',
      department: '',
      status: ''
    });
  };

  // Handle technician filter changes
  const handleTechnicianFilterChange = (filterType, value) => {
    setTechnicianFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all technician filters
  const clearTechnicianFilters = () => {
    setTechnicianFilters({
      search: '',
      department: ''
    });
  };

  // Add Technician Modal States
  const [addTechnicianModalOpen, setAddTechnicianModalOpen] = useState(false);
  const [newTechnician, setNewTechnician] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAddingTechnician, setIsAddingTechnician] = useState(false);

  // Edit Technician Modal States
  const [editTechnicianModalOpen, setEditTechnicianModalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState({
    _id: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: ''
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);
  const [isEditingTechnician, setIsEditingTechnician] = useState(false);

  // Delete Technician Modal States
  const [deleteTechnicianModalOpen, setDeleteTechnicianModalOpen] = useState(false);
  const [deletingTechnician, setDeletingTechnician] = useState({
    _id: '',
    username: '',
    department: ''
  });
  const [isDeletingTechnician, setIsDeletingTechnician] = useState(false);

  // Notification Export Modal States
  const [notificationExportModalOpen, setNotificationExportModalOpen] = useState(false);
  const [isExportingNotificationScreens, setIsExportingNotificationScreens] = useState(false);

  // Bulk Delete Modal States
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [selectedScansForDelete, setSelectedScansForDelete] = useState([]);
  const [isDeletingScans, setIsDeletingScans] = useState(false);

  // Generate PDF report for all sessions (or filtered sessions)
  const generateAllSessionsPDFReport = () => {
    try {
      console.log('🔍 Generating all sessions PDF...');
      console.log('🔍 Sessions to export:', filteredSessionsData.length);
      
      // Validate data
      if (!filteredSessionsData.length) {
        alert('❌ No sessions to export. Please check your filters or ensure sessions exist.');
        return;
      }
      
      // Create new PDF document
      const pdf = new jsPDF();
      
      // Add header with company branding
      pdf.setFillColor(52, 152, 219);
      pdf.rect(0, 0, 210, 30, 'F');
      
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text('EmbroideryTech', 105, 15, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.text('Sessions Report', 105, 25, { align: 'center' });
      
      // Add generation date
      pdf.setFontSize(10);
      pdf.setTextColor(127, 140, 141);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 105, 40, { align: 'center' });
      
      // Add filter information if filters are active
      if (sessionFilters.technician || sessionFilters.day || sessionFilters.department) {
        pdf.setFontSize(11);
        pdf.setTextColor(52, 152, 219);
        pdf.text('Filtered Results:', 20, 55);
        
        let filterY = 60;
        if (sessionFilters.technician) {
          pdf.text(`• Technician: ${sessionFilters.technician}`, 25, filterY);
          filterY += 5;
        }
        if (sessionFilters.day) {
          pdf.text(`• Date: ${new Date(sessionFilters.day).toLocaleDateString()}`, 25, filterY);
          filterY += 5;
        }
        if (sessionFilters.department) {
          pdf.text(`• Department: ${sessionFilters.department}`, 25, filterY);
          filterY += 5;
        }
        
        // Add separator line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, filterY + 5, 190, filterY + 5);
      }
      
      // Add summary statistics
      const startY = sessionFilters.technician || sessionFilters.day || sessionFilters.department ? 80 : 60;
      pdf.setFontSize(12);
      pdf.setTextColor(44, 62, 80);
      pdf.text(`Total Sessions: ${filteredSessionsData.length}`, 20, startY);
      
      const completedSessions = filteredSessionsData.filter(s => s.endTime).length;
      const activeSessions = filteredSessionsData.filter(s => !s.endTime).length;
      const totalScans = filteredSessionsData.reduce((sum, s) => sum + (s.scanCount || 0), 0);
      
      pdf.text(`Completed: ${completedSessions}`, 20, startY + 8);
      pdf.text(`Active: ${activeSessions}`, 20, startY + 16);
      pdf.text(`Total Scans: ${totalScans}`, 20, startY + 24);
      
      // Add separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, startY + 30, 190, startY + 30);
      
      // Add sessions table
      let currentY = startY + 40;
      const pageHeight = 280;
      const rowHeight = 25;
      let sessionIndex = 0;
      
      for (const session of filteredSessionsData) {
        // Check if we need a new page
        if (currentY > pageHeight) {
          pdf.addPage();
          currentY = 20;
          
          // Add header to new page
          pdf.setFillColor(52, 152, 219);
          pdf.rect(0, 0, 210, 15, 'F');
          pdf.setFontSize(12);
          pdf.setTextColor(255, 255, 255);
          pdf.text('EmbroideryTech - Sessions Report (Continued)', 105, 8, { align: 'center' });
        }
        
        // Create session card background
        pdf.setFillColor(248, 249, 250);
        pdf.rect(20, currentY - 5, 170, rowHeight, 'F');
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(20, currentY - 5, 170, rowHeight, 'S');
        
        // Session header
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(44, 62, 80);
        pdf.text(`Session ${sessionIndex + 1}: ${String(session._id?.slice(-8) || 'Unknown')}`, 25, currentY);
        
        // Session status
        const status = session.endTime ? '✅ Completed' : '🔄 Active';
        pdf.setTextColor(session.endTime ? 39 : 243, session.endTime ? 174 : 156, session.endTime ? 96 : 18);
        pdf.text(status, 150, currentY);
        pdf.setTextColor(44, 62, 80);
        
        // Session details
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`Technician: ${String(session.technician || 'Unknown')}`, 25, currentY + 6);
        pdf.text(`Department: ${String(session.department || 'Unknown')}`, 25, currentY + 12);
        pdf.text(`Scans: ${String(session.scanCount || 0)}`, 25, currentY + 18);
        
        // Time information
        const startTime = new Date(session.startTime).toLocaleString();
        pdf.text(`Start: ${startTime}`, 100, currentY + 6);
        
        if (session.endTime) {
          const endTime = new Date(session.endTime).toLocaleString();
          pdf.text(`End: ${endTime}`, 100, currentY + 12);
          
          // Calculate duration
          const duration = new Date(session.endTime) - new Date(session.startTime);
          const minutes = Math.floor(duration / (1000 * 60));
          const seconds = Math.floor((duration % (1000 * 60)) / 1000);
          pdf.text(`Duration: ${minutes}m ${seconds}s`, 100, currentY + 18);
        }
        
        currentY += rowHeight + 5;
        sessionIndex++;
      }
      
      // Add footer with border
      pdf.setFillColor(44, 62, 80);
      pdf.rect(20, 270, 170, 25, 'F');
      
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text('This report was generated by EmbroideryTech Desktop Management System', 105, 280, { align: 'center' });
      pdf.text('For technical support, contact the IT department', 105, 288, { align: 'center' });
      
      // Save the PDF
      const filterSuffix = sessionFilters.technician || sessionFilters.day || sessionFilters.department ? '_Filtered' : '_All';
      const filename = `Sessions_Report${filterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('🔍 Saving PDF with filename:', filename);
      
      try {
        pdf.save(filename);
        alert(`✅ Sessions PDF Report downloaded successfully!\n\n📊 Exported ${filteredSessionsData.length} sessions`);
      } catch (saveError) {
        console.error('❌ Error saving PDF:', saveError);
        // Fallback: try to save with a simpler filename
        const fallbackFilename = `Sessions_Report_${Date.now()}.pdf`;
        pdf.save(fallbackFilename);
        alert(`✅ Sessions PDF Report downloaded successfully!\n\n📊 Exported ${filteredSessionsData.length} sessions`);
      }
      
         } catch (error) {
       console.error('❌ Error generating all sessions PDF report:', error);
       console.error('❌ Error details:', error.message);
       alert('❌ Error generating sessions PDF report. Please try again.');
     }
   };

   // Generate PDF report for all scan history (or filtered scans)
   const generateAllScanHistoryPDFReport = () => {
     try {
       console.log('🔍 Generating all scan history PDF...');
       
       // Get all scans from filtered grouped scans
       const allScans = Object.values(filteredGroupedScans).flat();
       console.log('🔍 Scans to export:', allScans.length);
       
       // Validate data
       if (!allScans.length) {
         alert('❌ No scans to export. Please check your filters or ensure scans exist.');
         return;
       }
       
       // Create new PDF document
       const pdf = new jsPDF();
       
       // Add header with company branding
       pdf.setFillColor(52, 152, 219);
       pdf.rect(0, 0, 210, 30, 'F');
       
       pdf.setFontSize(20);
       pdf.setTextColor(255, 255, 255);
       pdf.text('EmbroideryTech', 105, 15, { align: 'center' });
       
       pdf.setFontSize(14);
       pdf.text('Scan History Report', 105, 25, { align: 'center' });
       
       // Add generation date
       pdf.setFontSize(10);
       pdf.setTextColor(127, 140, 141);
       pdf.text(`Generated on ${new Date().toLocaleString()}`, 105, 40, { align: 'center' });
       
       // Add filter information if filters are active
       if (scanHistoryFilters.technician || scanHistoryFilters.department || scanHistoryFilters.status) {
         pdf.setFontSize(11);
         pdf.setTextColor(52, 152, 219);
         pdf.text('Filtered Results:', 20, 55);
         
         let filterY = 60;
         if (scanHistoryFilters.technician) {
           pdf.text(`• Technician: ${scanHistoryFilters.technician}`, 25, filterY);
           filterY += 5;
         }
         if (scanHistoryFilters.department) {
           pdf.text(`• Department: ${scanHistoryFilters.department}`, 25, filterY);
           filterY += 5;
         }
         if (scanHistoryFilters.status) {
           pdf.text(`• Status: ${scanHistoryFilters.status}`, 25, filterY);
           filterY += 5;
         }
         
         // Add separator line
         pdf.setDrawColor(200, 200, 200);
         pdf.line(20, filterY + 5, 190, filterY + 5);
       }
       
       // Add summary statistics
       const startY = scanHistoryFilters.technician || scanHistoryFilters.department || scanHistoryFilters.status ? 80 : 60;
       pdf.setFontSize(12);
       pdf.setTextColor(44, 62, 80);
       pdf.text(`Total Scans: ${allScans.length}`, 20, startY);
       
       const healthyScans = allScans.filter(s => s.status === 'Healthy').length;
       const reparableScans = allScans.filter(s => s.status === 'Reparable').length;
       const beyondRepairScans = allScans.filter(s => s.status === 'Beyond Repair').length;
       
       pdf.text(`Healthy: ${healthyScans}`, 20, startY + 8);
       pdf.text(`Reparable: ${reparableScans}`, 20, startY + 16);
       pdf.text(`Beyond Repair: ${beyondRepairScans}`, 20, startY + 24);
       
       // Add separator line
       pdf.setDrawColor(200, 200, 200);
       pdf.line(20, startY + 30, 190, startY + 30);
       
       // Add scans table
       let currentY = startY + 40;
       const pageHeight = 280;
       const rowHeight = 25;
       let scanIndex = 0;
       
       for (const scan of allScans) {
         // Check if we need a new page
         if (currentY > pageHeight) {
           pdf.addPage();
           currentY = 20;
           
           // Add header to new page
           pdf.setFillColor(52, 152, 219);
           pdf.rect(0, 0, 210, 15, 'F');
           pdf.setFontSize(12);
           pdf.setTextColor(255, 255, 255);
           pdf.text('EmbroideryTech - Scan History Report (Continued)', 105, 8, { align: 'center' });
         }
         
         // Create scan card background
         pdf.setFillColor(248, 249, 250);
         pdf.rect(20, currentY - 5, 170, rowHeight, 'F');
         pdf.setDrawColor(200, 200, 200);
         pdf.rect(20, currentY - 5, 170, rowHeight, 'S');
         
         // Scan header
         pdf.setFontSize(11);
         pdf.setFont('helvetica', 'bold');
         pdf.setTextColor(44, 62, 80);
         pdf.text(`Scan ${scanIndex + 1}: ${String(scan.barcode || 'Unknown')}`, 25, currentY);
         
         // Scan status with color
         const statusColors = {
           'Healthy': [39, 174, 96],
           'Reparable': [243, 156, 18],
           'Beyond Repair': [231, 76, 60]
         };
         const statusColor = statusColors[scan.status] || [44, 62, 80];
         pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
         pdf.text(String(scan.status || 'Unknown'), 150, currentY);
         pdf.setTextColor(44, 62, 80);
         
         // Scan details
         pdf.setFont('helvetica', 'normal');
         pdf.setFontSize(9);
         pdf.text(`Technician: ${String(scan.technician || 'Unknown')}`, 25, currentY + 6);
         pdf.text(`Department: ${String(scan.department || 'Unknown')}`, 25, currentY + 12);
         pdf.text(`Scan ID: ${String(scan._id?.slice(-8) || 'Unknown')}`, 25, currentY + 18);
         
         // Time information
         const scanTime = new Date(scan.timestamp || scan.date).toLocaleString();
         pdf.text(`Time: ${scanTime}`, 100, currentY + 6);
         
         // Session information if available
         if (scan.sessionId) {
           pdf.text(`Session: ${String(scan.sessionId?.slice(-8) || 'Unknown')}`, 100, currentY + 12);
         }
         
         currentY += rowHeight + 5;
         scanIndex++;
       }
       
       // Add footer with border
       pdf.setFillColor(44, 62, 80);
       pdf.rect(20, 270, 170, 25, 'F');
       
       pdf.setFontSize(9);
       pdf.setTextColor(255, 255, 255);
       pdf.text('This report was generated by EmbroideryTech Desktop Management System', 105, 280, { align: 'center' });
       pdf.text('For technical support, contact the IT department', 105, 288, { align: 'center' });
       
       // Save the PDF
       const filterSuffix = scanHistoryFilters.technician || scanHistoryFilters.department || scanHistoryFilters.status ? '_Filtered' : '_All';
       const filename = `Scan_History_Report${filterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
       console.log('🔍 Saving PDF with filename:', filename);
       
       try {
         pdf.save(filename);
         alert(`✅ Scan History PDF Report downloaded successfully!\n\n📊 Exported ${allScans.length} scans`);
       } catch (saveError) {
         console.error('❌ Error saving PDF:', saveError);
         // Fallback: try to save with a simpler filename
         const fallbackFilename = `Scan_History_Report_${Date.now()}.pdf`;
         pdf.save(fallbackFilename);
         alert(`✅ Scan History PDF Report downloaded successfully!\n\n📊 Exported ${allScans.length} scans`);
       }
       
     } catch (error) {
       console.error('❌ Error generating all scan history PDF report:', error);
       console.error('❌ Error details:', error.message);
       alert('❌ Error generating scan history PDF report. Please try again.');
     }
   };

   // Validate technician form (mirrors mobile app validation)
   const validateTechnicianForm = () => {
     if (!newTechnician.username.trim()) {
       alert('❌ Username is required');
       return false;
     }

     if (newTechnician.username.trim().length < 3) {
       alert('❌ Username must be at least 3 characters');
       return false;
     }

     if (!newTechnician.email.trim()) {
       alert('❌ Email is required');
       return false;
     }

     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(newTechnician.email.trim())) {
       alert('❌ Please enter a valid email address');
       return false;
     }

     if (!newTechnician.password) {
       alert('❌ Password is required');
       return false;
     }

     if (newTechnician.password.length < 6) {
       alert('❌ Password must be at least 6 characters');
       return false;
     }

     if (newTechnician.password !== newTechnician.confirmPassword) {
       alert('❌ Passwords do not match');
       return false;
     }

     if (!newTechnician.department.trim()) {
       alert('❌ Department is required');
       return false;
     }

     return true;
   };

   // Handle technician form input changes
   const handleTechnicianInputChange = (field, value) => {
     setNewTechnician(prev => ({
       ...prev,
       [field]: value
     }));
   };

   // Handle add technician submission
   const handleAddTechnician = async () => {
     if (!validateTechnicianForm()) return;

     console.log('🔄 Adding technician attempt started');
     console.log('Username:', newTechnician.username);
     console.log('Email:', newTechnician.email);
     console.log('Department:', newTechnician.department);
     
     setIsAddingTechnician(true);

     try {
       const BACKEND_URL = 'https://embroider-scann-app.onrender.com';
       console.log('🌐 Making fetch request to:', `${BACKEND_URL}/api/auth/register`);
       
       const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           username: newTechnician.username.trim(), 
           email: newTechnician.email.trim(),
           password: newTechnician.password,
           department: newTechnician.department.trim()
         }),
       });

       console.log('📡 Response received:', res.status, res.statusText);

       const contentType = res.headers.get('content-type');
       let data;
       
       if (contentType && contentType.includes('application/json')) {
         console.log('✅ Parsing JSON response');
         data = await res.json();
         console.log('📦 Parsed data:', data);
       } else {
         console.log('❌ Non-JSON response detected');
         const text = await res.text();
         console.log('Non-JSON response:', text);
         data = { error: 'Server returned non-JSON response' };
       }

       if (res.ok) {
         console.log('✅ Technician registration successful');
         alert('✅ Technician registered successfully!\n\nThe new technician can now log in to the app.');
         
         // Clear form
         setNewTechnician({
           username: '',
           email: '',
           password: '',
           confirmPassword: '',
           department: ''
         });
         
         // Close modal
         setAddTechnicianModalOpen(false);
         
         // Refresh users data
         const authToken = localStorage.getItem('authToken');
         if (authToken) {
           fetchAllData(authToken);
         }
       } else {
         console.log('❌ Technician registration failed:', data.error);
         const errorMessage = data.error || `Registration failed (${res.status})`;
         alert(`❌ Registration Failed\n\n${errorMessage}`);
       }
     } catch (error) {
       console.error('💥 Technician registration error:', error);
       alert('❌ Connection Error\n\nPlease check your internet connection and try again');
     } finally {
       console.log('🏁 Setting loading to false');
       setIsAddingTechnician(false);
     }
   };

   // Reset technician form
   const resetTechnicianForm = () => {
     setNewTechnician({
       username: '',
       email: '',
       password: '',
       confirmPassword: '',
       department: ''
     });
     setShowPassword(false);
     setShowConfirmPassword(false);
   };

   // Open edit technician modal with existing data
   const handleEditTechnician = (technician) => {
     console.log('🔧 Opening edit modal for technician:', technician);
     setEditingTechnician({
       _id: technician._id,
       username: technician.username || '',
       email: technician.email || '',
       password: '',
       confirmPassword: '',
       department: technician.department || ''
     });
     setShowEditPassword(false);
     setShowEditConfirmPassword(false);
     setEditTechnicianModalOpen(true);
   };

   // Handle edit technician form input changes
   const handleEditTechnicianInputChange = (field, value) => {
     setEditingTechnician(prev => ({
       ...prev,
       [field]: value
     }));
   };

   // Validate edit technician form
   const validateEditTechnicianForm = () => {
     if (!editingTechnician.username.trim()) {
       alert('❌ Username is required');
       return false;
     }

     if (editingTechnician.username.trim().length < 3) {
       alert('❌ Username must be at least 3 characters');
       return false;
     }

     if (!editingTechnician.email.trim()) {
       alert('❌ Email is required');
       return false;
     }

     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(editingTechnician.email.trim())) {
       alert('❌ Please enter a valid email address');
       return false;
     }

     if (!editingTechnician.department.trim()) {
       alert('❌ Department is required');
       return false;
     }

     // Password is optional for editing, but if provided, validate it
     if (editingTechnician.password) {
       if (editingTechnician.password.length < 6) {
         alert('❌ Password must be at least 6 characters');
         return false;
       }

       if (editingTechnician.password !== editingTechnician.confirmPassword) {
         alert('❌ Passwords do not match');
         return false;
       }
     }

     return true;
   };

   // Handle edit technician submission
   const handleEditTechnicianSubmit = async () => {
     if (!validateEditTechnicianForm()) return;

     console.log('🔄 Editing technician attempt started');
     console.log('Technician ID:', editingTechnician._id);
     console.log('Username:', editingTechnician.username);
     console.log('Email:', editingTechnician.email);
     console.log('Department:', editingTechnician.department);
     console.log('Password provided:', editingTechnician.password ? 'Yes' : 'No');
     
     setIsEditingTechnician(true);

     try {
       // Since the mobile backend might not have a direct update endpoint,
       // we'll use the desktop backend API which should handle user updates
       const API_BASE_URL = process.env.REACT_APP_DESKTOP_API || 'http://localhost:5001';
       console.log('🌐 Making fetch request to:', `${API_BASE_URL}/api/admin/users/${editingTechnician._id}`);
       
       const updateData = {
         username: editingTechnician.username.trim(),
         email: editingTechnician.email.trim(),
         department: editingTechnician.department.trim()
       };

       // Only include password if it was provided
       if (editingTechnician.password) {
         updateData.password = editingTechnician.password;
       }

       const authToken = localStorage.getItem('authToken');
       const res = await fetch(`${API_BASE_URL}/api/admin/users/${editingTechnician._id}`, {
         method: 'PUT',
         headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${authToken}`
         },
         body: JSON.stringify(updateData),
       });

       console.log('📡 Response received:', res.status, res.statusText);

       const contentType = res.headers.get('content-type');
       let data;
       
       if (contentType && contentType.includes('application/json')) {
         console.log('✅ Parsing JSON response');
         data = await res.json();
         console.log('📦 Parsed data:', data);
       } else {
         console.log('❌ Non-JSON response detected');
         const text = await res.text();
         console.log('Non-JSON response:', text);
         data = { error: 'Server returned non-JSON response' };
       }

       if (res.ok) {
         console.log('✅ Technician update successful');
         alert('✅ Technician updated successfully!');
         
         // Close modal
         setEditTechnicianModalOpen(false);
         
         // Refresh users data
         if (authToken) {
           fetchAllData(authToken);
         }
       } else {
         console.log('❌ Technician update failed:', data.error);
         const errorMessage = data.error || `Update failed (${res.status})`;
         alert(`❌ Update Failed\n\n${errorMessage}`);
       }
     } catch (error) {
       console.error('💥 Technician update error:', error);
       alert('❌ Connection Error\n\nPlease check your internet connection and try again');
     } finally {
       console.log('🏁 Setting loading to false');
       setIsEditingTechnician(false);
     }
   };

   // Reset edit technician form
   const resetEditTechnicianForm = () => {
     setEditingTechnician({
       _id: '',
       username: '',
       email: '',
       password: '',
       confirmPassword: '',
       department: ''
     });
     setShowEditPassword(false);
     setShowEditConfirmPassword(false);
   };

   // Open delete technician confirmation modal
   const handleDeleteTechnician = (technician) => {
     console.log('🗑️ Opening delete confirmation for technician:', technician);
     setDeletingTechnician({
       _id: technician._id,
       username: technician.username || 'Unknown',
       department: technician.department || 'Unknown'
     });
     setDeleteTechnicianModalOpen(true);
   };

   // Handle delete technician confirmation
   const handleDeleteTechnicianConfirm = async () => {
     console.log('🔄 Deleting technician:', deletingTechnician);
     setIsDeletingTechnician(true);

     try {
       const API_BASE_URL = process.env.REACT_APP_DESKTOP_API || 'http://localhost:5001';
       console.log('🌐 Making delete request to:', `${API_BASE_URL}/api/admin/users/${deletingTechnician._id}`);
       
       const authToken = localStorage.getItem('authToken');
       const res = await fetch(`${API_BASE_URL}/api/admin/users/${deletingTechnician._id}`, {
         method: 'DELETE',
         headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${authToken}`
         }
       });

       console.log('📡 Response received:', res.status, res.statusText);

       const contentType = res.headers.get('content-type');
       let data;
       
       if (contentType && contentType.includes('application/json')) {
         console.log('✅ Parsing JSON response');
         data = await res.json();
         console.log('📦 Parsed data:', data);
       } else {
         console.log('❌ Non-JSON response detected');
         const text = await res.text();
         console.log('Non-JSON response:', text);
         data = { error: 'Server returned non-JSON response' };
       }

       if (res.ok) {
         console.log('✅ Technician deleted successfully');
         alert(`✅ Technician "${deletingTechnician.username}" has been deleted successfully!`);
         
         // Close modal
         setDeleteTechnicianModalOpen(false);
         
         // Refresh users data
         if (authToken) {
           fetchAllData(authToken);
         }
       } else {
         console.log('❌ Technician deletion failed:', data.error);
         const errorMessage = data.error || `Deletion failed (${res.status})`;
         alert(`❌ Deletion Failed\n\n${errorMessage}`);
       }
     } catch (error) {
       console.error('💥 Technician deletion error:', error);
       alert('❌ Connection Error\n\nPlease check your internet connection and try again');
     } finally {
       console.log('🏁 Setting loading to false');
       setIsDeletingTechnician(false);
     }
   };

     // Reset delete technician form
  const resetDeleteTechnicianForm = () => {
    setDeletingTechnician({
      _id: '',
      username: '',
      department: ''
    });
  };

  // Handle scan selection for bulk delete
  const handleScanSelection = (scanId) => {
    setSelectedScansForDelete(prev => {
      if (prev.includes(scanId)) {
        return prev.filter(id => id !== scanId);
      } else {
        return [...prev, scanId];
      }
    });
  };

  // Handle select all scans
  const handleSelectAllScans = () => {
    if (selectedScansForDelete.length === scanHistory.length) {
      setSelectedScansForDelete([]);
    } else {
      setSelectedScansForDelete(scanHistory.map(scan => scan._id));
    }
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteConfirm = async () => {
    if (selectedScansForDelete.length === 0) {
      alert('❌ Please select at least one scan to delete.');
      return;
    }

    console.log('🔄 Bulk deleting scans:', selectedScansForDelete);
    setIsDeletingScans(true);

    try {
      const API_BASE_URL = process.env.REACT_APP_DESKTOP_API || 'http://localhost:5001';
      const authToken = localStorage.getItem('authToken');
      
      // Delete scans one by one
      let successCount = 0;
      let errorCount = 0;
      
      for (const scanId of selectedScansForDelete) {
        try {
          console.log('🌐 Deleting scan:', scanId);
          
          const res = await fetch(`${API_BASE_URL}/api/admin/scans/${scanId}`, {
            method: 'DELETE',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });

          if (res.ok) {
            successCount++;
            console.log('✅ Scan deleted successfully:', scanId);
          } else {
            errorCount++;
            console.log('❌ Failed to delete scan:', scanId);
          }
        } catch (error) {
          errorCount++;
          console.error('❌ Error deleting scan:', scanId, error);
        }
      }

      // Show results
      if (successCount > 0) {
        alert(`✅ Successfully deleted ${successCount} scan(s)!\n${errorCount > 0 ? `❌ Failed to delete ${errorCount} scan(s).` : ''}`);
        
        // Close modal and refresh data
        setBulkDeleteModalOpen(false);
        setSelectedScansForDelete([]);
        
        // Refresh scan data
        if (authToken) {
          fetchAllData(authToken);
        }
      } else {
        alert(`❌ Failed to delete any scans. Please try again.`);
      }
      
    } catch (error) {
      console.error('💥 Bulk delete error:', error);
      alert('❌ Connection Error\n\nPlease check your internet connection and try again');
    } finally {
      setIsDeletingScans(false);
    }
  };

  // Reset bulk delete form
  const resetBulkDeleteForm = () => {
    setSelectedScansForDelete([]);
  };

  // Handle notification export button click
  const handleNotificationExportClick = () => {
    console.log('🔍 Notification export clicked');
    if (!selectedNotificationView || !selectedNotificationView.scans.length) {
      alert('❌ No screens to export. Please select a notification with screens.');
      return;
    }
    setNotificationExportModalOpen(true);
  };

  // Handle notification export confirmation
  const handleNotificationExportConfirm = () => {
    console.log('🔍 Notification export confirmed');
    setIsExportingNotificationScreens(true);
    generateNotificationScreensPDFReport();
    setNotificationExportModalOpen(false);
    setIsExportingNotificationScreens(false);
  };

  // Generate PDF report for notification screens
  const generateNotificationScreensPDFReport = () => {
    try {
      console.log('🔍 Generating notification screens PDF...');
      
      if (!selectedNotificationView || !selectedNotificationView.scans.length) {
        alert('❌ No screens to export. Please select a notification with screens.');
        return;
      }
      
      const scans = selectedNotificationView.scans;
      console.log('🔍 Scans to export:', scans.length);
      console.log('🔍 First scan details:', scans[0]);
      console.log('🔍 All scans:', scans);
      
      // Create new PDF document
      const pdf = new jsPDF();
      
      // Add header with company branding
      pdf.setFillColor(52, 152, 219);
      pdf.rect(0, 0, 210, 30, 'F');
      
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text('EmbroideryTech', 105, 15, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.text('Notification Screens Report', 105, 25, { align: 'center' });
      
      // Add generation date
      pdf.setFontSize(10);
      pdf.setTextColor(127, 140, 141);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 105, 40, { align: 'center' });
      
      // Add notification information
      pdf.setFontSize(12);
      pdf.setTextColor(44, 62, 80);
      pdf.text(`Notification: ${selectedNotificationView.title}`, 20, 55);
      pdf.text(`Total Screens: ${scans.length}`, 20, 62);
      pdf.text(`Status: ${selectedNotificationView.type.toUpperCase()}`, 20, 69);
      
      // Add separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 76, 190, 76);
      
      // Add summary section with notification-specific information
      pdf.setFontSize(11);
      pdf.setTextColor(52, 152, 219);
      pdf.text('📋 SCREENS LIST:', 20, 85);
      
      // Add notification-specific description
      let statusDescription = '';
      let statusColor = '#27ae60';
      
      if (selectedNotificationView.type === 'success') {
        statusDescription = 'HEALTHY - Ready for Production';
        statusColor = '#27ae60';
      } else if (selectedNotificationView.type === 'warning') {
        statusDescription = 'REPARABLE - Sent for Repair';
        statusColor = '#f39c12';
      } else if (selectedNotificationView.type === 'error') {
        statusDescription = 'BEYOND REPAIR - Written Off';
        statusColor = '#e74c3c';
      }
      
      pdf.setTextColor(statusColor);
      pdf.text(`Status: ${statusDescription}`, 20, 92);
      pdf.setTextColor(52, 152, 219);
      pdf.text(`Total Screens: ${scans.length}`, 20, 99);
      
      // Add another separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 98, 190, 98);
      
      // Add screens table
      let currentY = 105;
      const pageHeight = 280;
      const rowHeight = 25;
      let screenIndex = 0;
      
      for (const scan of scans) {
        // Check if we need a new page
        if (currentY > pageHeight) {
          pdf.addPage();
          currentY = 20;
          
          // Add header to new page
          pdf.setFillColor(52, 152, 219);
          pdf.rect(0, 0, 210, 15, 'F');
          pdf.setFontSize(12);
          pdf.setTextColor(255, 255, 255);
          pdf.text('EmbroideryTech - Notification Screens Report (Continued)', 105, 8, { align: 'center' });
        }
        
        // Create screen card background
        pdf.setFillColor(248, 249, 250);
        pdf.rect(20, currentY - 5, 170, rowHeight, 'F');
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(20, currentY - 5, 170, rowHeight, 'S');
        
        // Screen header with prominent numbering
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(52, 152, 219);
        pdf.text(`📱 SCREEN #${screenIndex + 1}`, 25, currentY);
        
        // Screen barcode
        pdf.setFontSize(11);
        pdf.setTextColor(44, 62, 80);
        pdf.text(`Barcode: ${String(scan.barcode || 'No Barcode')}`, 25, currentY + 6);
        
        // Screen status
        const statusColor = scan.status === 'Healthy' ? '#27ae60' : scan.status === 'Reparable' ? '#f39c12' : '#e74c3c';
        pdf.setTextColor(statusColor);
        pdf.text(`Status: ${String(scan.status)}`, 150, currentY + 6);
        pdf.setTextColor(44, 62, 80);
        
        // Screen details
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        
        // Get technician and department
        const technicianName = scan.technicianDisplay || scan.technician || 'Unknown';
        const department = (() => {
          if (scan.department) return scan.department;
          const foundUser = users.find(u => u.username === scan.technicianDisplay);
          if (foundUser) return foundUser.department;
          const foundUserByTechnician = users.find(u => u.username === scan.technician);
          if (foundUserByTechnician) return foundUserByTechnician.department;
          return 'Unknown';
        })();
        
        pdf.text(`Technician: ${String(technicianName)}`, 25, currentY + 8);
        pdf.text(`Department: ${String(department)}`, 25, currentY + 14);
        pdf.text(`Scan Time: ${new Date(scan.timestamp || scan.date).toLocaleString()}`, 25, currentY + 20);
        
        currentY += rowHeight + 5;
        screenIndex++;
      }
      
      // Add footer with border
      pdf.setFillColor(44, 62, 80);
      pdf.rect(20, 270, 170, 25, 'F');
      
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text('This report was generated by EmbroideryTech Desktop Management System', 105, 280, { align: 'center' });
      pdf.text('For technical support, contact the IT department', 105, 288, { align: 'center' });
      
      // Save the PDF with notification-specific filename
      let notificationType = '';
      if (selectedNotificationView.type === 'success') {
        notificationType = 'Production';
      } else if (selectedNotificationView.type === 'warning') {
        notificationType = 'Repair';
      } else if (selectedNotificationView.type === 'error') {
        notificationType = 'WrittenOff';
      }
      
      const filename = `Screens_${notificationType}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('🔍 Saving PDF with filename:', filename);
      
      try {
        pdf.save(filename);
        alert(`✅ ${selectedNotificationView.title} PDF Report downloaded successfully!\n\n📊 Exported ${scans.length} screens`);
      } catch (saveError) {
        console.error('❌ Error saving PDF:', saveError);
        // Fallback: try to save with a simpler filename
        const fallbackFilename = `Notification_Screens_${Date.now()}.pdf`;
        pdf.save(fallbackFilename);
        alert(`✅ ${selectedNotificationView.title} PDF Report downloaded successfully!\n\n📊 Exported ${scans.length} screens`);
      }
      
    } catch (error) {
      console.error('❌ Error generating notification screens PDF report:', error);
      console.error('❌ Error details:', error.message);
      alert('❌ Error generating notification screens PDF report. Please try again.');
    }
  };

   // Generate PDF report for all technicians (or filtered technicians)
   const generateAllTechniciansPDFReport = () => {
     try {
       console.log('🔍 Generating all technicians PDF...');
       
       // Use filtered technicians if filters are active, otherwise use all technicians
       const techniciansToExport = filteredTechnicians.length > 0 ? filteredTechnicians : users;
       console.log('🔍 Technicians to export:', techniciansToExport.length);
       
       // Validate data
       if (!techniciansToExport.length) {
         alert('❌ No technicians to export. Please check your filters or ensure technicians exist.');
         return;
       }
       
       // Create new PDF document
       const pdf = new jsPDF();
       
       // Add header with company branding
       pdf.setFillColor(52, 152, 219);
       pdf.rect(0, 0, 210, 30, 'F');
       
       pdf.setFontSize(20);
       pdf.setTextColor(255, 255, 255);
       pdf.text('EmbroideryTech', 105, 15, { align: 'center' });
       
       pdf.setFontSize(14);
       pdf.text('Technician Management Report', 105, 25, { align: 'center' });
       
       // Add generation date
       pdf.setFontSize(10);
       pdf.setTextColor(127, 140, 141);
       pdf.text(`Generated on ${new Date().toLocaleString()}`, 105, 40, { align: 'center' });
       
       // Add filter information if filters are active
       if (technicianFilters.search || technicianFilters.department) {
         pdf.setFontSize(11);
         pdf.setTextColor(52, 152, 219);
         pdf.text('Filtered Results:', 20, 55);
         
         let filterY = 60;
         if (technicianFilters.search) {
           pdf.text(`• Search: ${technicianFilters.search}`, 25, filterY);
           filterY += 5;
         }
         if (technicianFilters.department) {
           pdf.text(`• Department: ${technicianFilters.department}`, 25, filterY);
           filterY += 5;
         }
         
         // Add separator line
         pdf.setDrawColor(200, 200, 200);
         pdf.line(20, filterY + 5, 190, filterY + 5);
       }
       
       // Add summary statistics
       const startY = technicianFilters.search || technicianFilters.department ? 80 : 60;
       pdf.setFontSize(12);
       pdf.setTextColor(44, 62, 80);
       pdf.text(`Total Technicians: ${techniciansToExport.length}`, 20, startY);
       
       const departments = new Set(techniciansToExport.map(t => t.department));
       const activeTechnicians = techniciansToExport.length;
       
       pdf.text(`Departments: ${departments.size}`, 20, startY + 8);
       pdf.text(`Active: ${activeTechnicians}`, 20, startY + 16);
       
       // Add separator line
       pdf.setDrawColor(200, 200, 200);
       pdf.line(20, startY + 24, 190, startY + 24);
       
       // Add technicians table
       let currentY = startY + 35;
       const pageHeight = 280;
       const rowHeight = 30;
       let technicianIndex = 0;
       
       for (const technician of techniciansToExport) {
         // Check if we need a new page
         if (currentY > pageHeight) {
           pdf.addPage();
           currentY = 20;
           
           // Add header to new page
           pdf.setFillColor(52, 152, 219);
           pdf.rect(0, 0, 210, 15, 'F');
           pdf.setFontSize(12);
           pdf.setTextColor(255, 255, 255);
           pdf.text('EmbroideryTech - Technician Report (Continued)', 105, 8, { align: 'center' });
         }
         
         // Create technician card background
         pdf.setFillColor(248, 249, 250);
         pdf.rect(20, currentY - 5, 170, rowHeight, 'F');
         pdf.setDrawColor(200, 200, 200);
         pdf.rect(20, currentY - 5, 170, rowHeight, 'S');
         
         // Technician header
         pdf.setFontSize(11);
         pdf.setFont('helvetica', 'bold');
         pdf.setTextColor(44, 62, 80);
         pdf.text(`Technician ${technicianIndex + 1}: ${String(technician.username || 'Unknown')}`, 25, currentY);
         
         // Technician status
         pdf.setTextColor(39, 174, 96);
         pdf.text('Active', 150, currentY);
         pdf.setTextColor(44, 62, 80);
         
         // Technician details
         pdf.setFont('helvetica', 'normal');
         pdf.setFontSize(9);
         pdf.text(`Department: ${String(technician.department || 'No Department')}`, 25, currentY + 8);
         pdf.text(`Role: Technician`, 25, currentY + 14);
         pdf.text(`ID: ${String(technician._id?.slice(-8) || 'Unknown')}`, 25, currentY + 20);
         
         // Additional information
         if (technician.name) {
           pdf.text(`Name: ${String(technician.name)}`, 100, currentY + 8);
         }
         if (technician.email) {
           pdf.text(`Email: ${String(technician.email)}`, 100, currentY + 14);
         }
         
         currentY += rowHeight + 5;
         technicianIndex++;
       }
       
       // Add footer with border
       pdf.setFillColor(44, 62, 80);
       pdf.rect(20, 270, 170, 25, 'F');
       
       pdf.setFontSize(9);
       pdf.setTextColor(255, 255, 255);
       pdf.text('This report was generated by EmbroideryTech Desktop Management System', 105, 280, { align: 'center' });
       pdf.text('For technical support, contact the IT department', 105, 288, { align: 'center' });
       
       // Save the PDF
       const filterSuffix = technicianFilters.search || technicianFilters.department ? '_Filtered' : '_All';
       const filename = `Technician_Report${filterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
       console.log('🔍 Saving PDF with filename:', filename);
       
       try {
         pdf.save(filename);
         alert(`✅ Technician PDF Report downloaded successfully!\n\n📊 Exported ${techniciansToExport.length} technicians`);
       } catch (saveError) {
         console.error('❌ Error saving PDF:', saveError);
         // Fallback: try to save with a simpler filename
         const fallbackFilename = `Technician_Report_${Date.now()}.pdf`;
         pdf.save(fallbackFilename);
         alert(`✅ Technician PDF Report downloaded successfully!\n\n📊 Exported ${techniciansToExport.length} technicians`);
       }
       
     } catch (error) {
       console.error('❌ Error generating all technicians PDF report:', error);
       console.error('❌ Error details:', error.message);
       alert('❌ Error generating technician PDF report. Please try again.');
     }
   };
  useEffect(() => {
    // Get token from localStorage
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      setToken(authToken);
      initializeData(authToken);
    } else {
      setError('No authentication token found. Please login again.');
      setLoading(false);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
      if (notificationDropdownOpen && !event.target.closest('.notifications-dropdown')) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen, notificationDropdownOpen]);

  // Reset notifications viewed when new scan data is detected
  useEffect(() => {
    if (generateNotifications.length > 0 && notificationsViewed) {
      // Simple check: if we have notifications and they were viewed, 
      // reset when scan history changes (indicating new activity)
      setNotificationsViewed(false);
    }
  }, [scanHistory.length]); // Only depend on scan count changes

  const initializeData = async (authToken) => {
    try {
      fetchAllData(authToken);
    } catch (err) {
      console.error('Error initializing data:', err);
      setError('Connection error');
    }
  };

  const fetchAllData = async (authToken) => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, profileRes, scanHistoryRes, usersRes, sessionsRes, notificationsRes] = await Promise.all([
        fetch(`${DESKTOP_API}/api/dashboard/overview`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/profile`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/scan-history`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/users`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/sessions`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/notifications`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        const overview = overviewData.data.overview;
        const statusBreakdown = overviewData.data.statusBreakdown;
        const deptStats = overviewData.data.departmentStats;
        
        setDashboardOverview(overview);
        setDepartmentStats(deptStats);
        
        setScanStats({
          totalScans: overview.totalScans,
          reparable: statusBreakdown.Reparable || 0,
          beyondRepair: statusBreakdown['Beyond Repair'] || 0,
          healthy: statusBreakdown.Healthy || 0
        });
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfile(profileData.data);
      }

      if (scanHistoryRes.ok) {
        const scanData = await scanHistoryRes.json();
        const newScanHistory = scanData.scans;
        console.log('🔍 Scan History Data:', newScanHistory);
        console.log('🔍 First scan details:', newScanHistory[0]);
        setScanHistory(newScanHistory);
        
        // Check if there are new scans (simple check - if scan count changed)
        if (newScanHistory.length !== scanHistory.length) {
          setNotificationsViewed(false);
        }
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        console.log('👥 Users Data:', usersData.data);
        setUsers(usersData.data);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.data);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.data);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data from database');
    } finally {
      setLoading(false);
    }
  };

  const groupedScans = useMemo(() => {
    const filtered = scanHistory.filter(scan => {
      const techMatch = filterTechnician ? scan.technician?.includes(filterTechnician) : true;
      const deptMatch = filterDepartment
        ? users.find(u => `${u.name} ${u.surname}` === scan.technician)?.department?.includes(filterDepartment)
        : true;
      return techMatch && deptMatch;
    });

    return filtered.reduce((acc, scan) => {
      if (!acc[scan.technician]) acc[scan.technician] = [];
      acc[scan.technician].push(scan);
      return acc;
    }, {});
  }, [scanHistory, filterTechnician, filterDepartment, users]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reparable': return '#ff9800';
      case 'Beyond Repair': return '#f44336';
      case 'Healthy': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Reparable': return '🔧';
      case 'Beyond Repair': return '❌';
      case 'Healthy': return '✅';
      default: return '❓';
    }
  };

  // Generate notifications based on scan statuses
  const generateNotifications = useMemo(() => {
    const notifications = [];
    
    // Group scans by status
    const healthyScans = scanHistory.filter(scan => scan.status === 'Healthy');
    const reparableScans = scanHistory.filter(scan => scan.status === 'Reparable');
    const beyondRepairScans = scanHistory.filter(scan => scan.status === 'Beyond Repair');
    
    // Add notifications for each status
    if (healthyScans.length > 0) {
      notifications.push({
        id: 'healthy-scans',
        type: 'success',
        icon: '✅',
        title: 'Screens Sent for Production',
        message: `${healthyScans.length} screen(s) with HEALTHY status have been marked for production.`,
        count: healthyScans.length,
        timestamp: new Date().toISOString(),
        scans: healthyScans
      });
    }
    
    if (reparableScans.length > 0) {
      notifications.push({
        id: 'reparable-scans',
        type: 'warning',
        icon: '🔧',
        title: 'Screens Sent for Repair',
        message: `${reparableScans.length} screen(s) with REPAIRABLE status have been sent for repair.`,
        count: reparableScans.length,
        timestamp: new Date().toISOString(),
        scans: reparableScans
      });
    }
    
    if (beyondRepairScans.length > 0) {
      notifications.push({
        id: 'beyond-repair-scans',
        type: 'error',
        icon: '❌',
        title: 'Screens Written Off',
        message: `${beyondRepairScans.length} screen(s) with BEYOND REPAIR status have been written off.`,
        count: beyondRepairScans.length,
        timestamp: new Date().toISOString(),
        scans: beyondRepairScans
      });
    }
    
    return notifications;
  }, [scanHistory]);

  // Filter sessions based on selected criteria
  const filteredSessionsData = useMemo(() => {
    if (!sessions.length) return [];
    
    let filtered = [...sessions];
    
    // Filter by technician
    if (sessionFilters.technician) {
      filtered = filtered.filter(session => 
        session.technician && 
        session.technician.toLowerCase().includes(sessionFilters.technician.toLowerCase())
      );
    }
    
    // Filter by day
    if (sessionFilters.day) {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.startTime).toDateString();
        const filterDate = new Date(sessionFilters.day).toDateString();
        return sessionDate === filterDate;
      });
    }
    
    // Filter by department
    if (sessionFilters.department) {
      filtered = filtered.filter(session => 
        session.department && 
        session.department.toLowerCase().includes(sessionFilters.department.toLowerCase())
      );
    }
    
    return filtered;
  }, [sessions, sessionFilters]);

  // Filter grouped scans based on selected criteria (preserving existing structure)
  const filteredGroupedScans = useMemo(() => {
    if (!groupedScans || Object.keys(groupedScans).length === 0) return {};
    
    let filtered = {};
    
    Object.entries(groupedScans).forEach(([technician, scans]) => {
      // Filter by technician name
      if (scanHistoryFilters.technician && 
          !technician.toLowerCase().includes(scanHistoryFilters.technician.toLowerCase())) {
        return; // Skip this technician if doesn't match filter
      }
      
      // Filter scans by department and status
      let filteredScans = scans;
      if (scanHistoryFilters.department) {
        filteredScans = filteredScans.filter(scan => 
          scan.department && 
          scan.department.toLowerCase().includes(scanHistoryFilters.department.toLowerCase())
        );
      }
      
      if (scanHistoryFilters.status) {
        filteredScans = filteredScans.filter(scan => 
          scan.status && 
          scan.status.toLowerCase() === scanHistoryFilters.status.toLowerCase()
        );
      }
      
      // Only add technician if they have scans after filtering
      if (filteredScans.length > 0) {
        filtered[technician] = filteredScans;
      }
    });
    
    return filtered;
  }, [groupedScans, scanHistoryFilters]);

  // Filter technicians based on selected criteria
  const filteredTechnicians = useMemo(() => {
    if (!users.length) return [];
    
    let filtered = [...users];
    
    // Filter by search (name or username)
    if (technicianFilters.search) {
      filtered = filtered.filter(user => 
        (user.username && user.username.toLowerCase().includes(technicianFilters.search.toLowerCase())) ||
        (user.name && user.name.toLowerCase().includes(technicianFilters.search.toLowerCase()))
      );
    }
    
    // Filter by department
    if (technicianFilters.department) {
      filtered = filtered.filter(user => 
        user.department && 
        user.department.toLowerCase() === technicianFilters.department.toLowerCase()
      );
    }
    
    return filtered;
  }, [users, technicianFilters]);

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>🔄 Loading Dashboard Data...</h2>
          <p>Fetching real-time data from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="error-container">
          <h2>❌ Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${sidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      
      <div className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">⚙️</div>
            <h2 className="sidebar-title">Admin Panel</h2>
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <div className={`hamburger ${sidebarOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Technicians</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'scans' ? 'active' : ''}`}
            onClick={() => setActiveTab('scans')}
          >
            <span className="nav-icon">📱</span>
            <span className="nav-text">Scan History</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <span className="nav-icon">⏱️</span>
            <span className="nav-text">Sessions</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <span className="nav-icon">🔔</span>
            <span className="nav-text">Notifications</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="connection-status">
            <div className="status-indicator online"></div>
            <span>Live Connection</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
              <div className={`hamburger ${sidebarOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
            <div className="header-title">
              <h1>🏭 EmbroideryTech Admin</h1>
              {userProfile && (
                <p className="welcome-text">
                  Welcome back, <strong>{userProfile.username}</strong> 
                  {userProfile.department && ` (${userProfile.department})`}
                </p>
              )}
            </div>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <button className="refresh-btn" onClick={() => fetchAllData(token)} title="Refresh Data">
                🔄
              </button>
              <div className="notifications-dropdown">
                <button 
                  className="notifications-btn" 
                  title="Notifications"
                  onClick={() => {
                    setNotificationDropdownOpen(!notificationDropdownOpen);
                    if (!notificationsViewed) {
                      setNotificationsViewed(true);
                    }
                  }}
                >
                  🔔
                  {generateNotifications.length > 0 && !notificationsViewed && (
                    <span className="notification-badge">{generateNotifications.length}</span>
                  )}
                </button>
                
                {notificationDropdownOpen && (
                  <div className="notifications-panel">
                    <div className="notifications-header">
                      <h3>🔔 Notifications ({generateNotifications.length})</h3>
                      <button 
                        className="close-notifications"
                        onClick={() => setNotificationDropdownOpen(false)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="notifications-list">
                      {generateNotifications.length === 0 ? (
                        <div className="no-notifications">
                          <p>No new notifications</p>
                        </div>
                      ) : (
                        generateNotifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`notification-item ${notification.type} clickable`}
                            onClick={() => {
                              setSelectedNotificationView(notification);
                              setNotificationDropdownOpen(false);
                              if (!notificationsViewed) {
                                setNotificationsViewed(true);
                              }
                            }}
                          >
                            <div className="notification-icon">{notification.icon}</div>
                            <div className="notification-content">
                              <h4>{notification.title}</h4>
                              <p>{notification.message}</p>
                              <span className="notification-time">
                                {new Date(notification.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="notification-count">
                              {notification.count}
                            </div>
                            
                          </div>
                        ))
                      )}
                    </div>
                    <div className="notifications-footer">
                      <button 
                        className="view-all-notifications"
                        onClick={() => {
                          setActiveTab('notifications');
                          setNotificationDropdownOpen(false);
                        }}
                      >
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                className="bulk-delete-btn" 
                title="Bulk Delete Screens"
                onClick={() => setBulkDeleteModalOpen(true)}
              >
                🗑️
              </button>
              
              <div className="user-dropdown">
                <button 
                  className="user-btn" 
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <div className="user-avatar">
                    {userProfile?.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <span className="user-name">{userProfile?.username || 'Admin'}</span>
                  <span className={`dropdown-arrow ${userDropdownOpen ? 'rotated' : ''}`}>▼</span>
                </button>
                
                {userDropdownOpen && (
                  <div className="user-panel">
                    <div className="user-info">
                      <strong>{userProfile?.username || 'Admin'}</strong>
                      <span>{userProfile?.department || 'Administrator'}</span>
                    </div>
                    <div className="user-actions">
                      <button className="logout-btn" onClick={handleLogout}>
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="last-updated">
              <span className="update-indicator">🔄</span>
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="section-header">
                <h2>📊 Dashboard Overview</h2>
                <div className="section-actions">
                  <button className="export-btn">
                    📥 Export Data
                  </button>
                  <button className="settings-btn">
                    ⚙️ Settings
                  </button>
                </div>
              </div>
              
              <div className="stats-grid">
                <div className="stat-card primary clickable" onClick={() => setActiveTab('users')}>
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>Total Technicians</h3>
                    <div className="stat-value">{dashboardOverview.totalUsers}</div>
                    <div className="stat-trend positive">↗️ +12% this month</div>
                    <div className="click-hint">👆 Click to View</div>
                  </div>
                </div>
                
                <div className="stat-card success clickable" onClick={() => setActiveTab('sessions')}>
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <h3>Total Sessions</h3>
                    <div className="stat-value">{dashboardOverview.totalSessions}</div>
                    <div className="stat-trend positive">↗️ +8% this week</div>
                    <div className="click-hint">👆 Click to View</div>
                  </div>
                </div>
                
                <div className="stat-card info clickable" onClick={() => setActiveTab('scans')}>
                  <div className="stat-icon">📱</div>
                  <div className="stat-content">
                    <h3>Total Scans</h3>
                    <div className="stat-value">{dashboardOverview.totalScans}</div>
                    <div className="stat-trend positive">↗️ +15% today</div>
                    <div className="click-hint">👆 Click to View</div>
                  </div>
                </div>
                
                <div className="stat-card warning clickable" onClick={() => setActiveTab('scans')}>
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <h3>Today's Scans</h3>
                    <div className="stat-value">{dashboardOverview.todayScans}</div>
                    <div className="stat-trend neutral">→ No change</div>
                    <div className="click-hint">👆 Click to View</div>
                  </div>
                </div>
                
                <div className="stat-card secondary clickable" onClick={() => setActiveTab('scans')}>
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <h3>Weekly Scans</h3>
                    <div className="stat-value">{dashboardOverview.weeklyScans}</div>
                    <div className="stat-trend positive">↗️ +22% this week</div>
                     <div className="click-hint">👆 Click to View</div>
                  </div>
                </div>
              </div>

              <div className="scan-breakdown">
                <h3>📊 Scan Status Breakdown</h3>
                <div className="status-cards">
                  <div className="status-card healthy clickable" onClick={() => setActiveTab('scans')}>
                    <div className="status-icon">✅</div>
                    <div className="status-content">
                      <h4>Healthy</h4>
                      <div className="status-value">{scanStats.healthy}</div>
                      <div className="status-percentage">
                        {scanStats.totalScans > 0 ? Math.round((scanStats.healthy / scanStats.totalScans) * 100) : 0}%
                      </div>
                      <div className="status-bar">
                        <div 
                          className="status-fill" 
                          style={{width: `${scanStats.totalScans > 0 ? (scanStats.healthy / scanStats.totalScans) * 100 : 0}%`}}
                        ></div>
                      </div>
                      <div className="click-hint">👆 Click to View</div>
                    </div>
                  </div>
                  
                  <div className="status-card reparable clickable" onClick={() => setActiveTab('scans')}>
                    <div className="status-icon">🔧</div>
                    <div className="status-content">
                      <h4>Reparable</h4>
                      <div className="status-value">{scanStats.reparable}</div>
                      <div className="status-percentage">
                        {scanStats.totalScans > 0 ? Math.round((scanStats.reparable / scanStats.totalScans) * 100) : 0}%
                      </div>
                      <div className="status-bar">
                        <div 
                          className="status-fill" 
                          style={{width: `${scanStats.totalScans > 0 ? (scanStats.reparable / scanStats.totalScans) * 100 : 0}%`}}
                        ></div>
                      </div>
                      <div className="click-hint">👆 Click to View</div>
                    </div>
                  </div>
                  
                  <div className="status-card beyond-repair clickable" onClick={() => setActiveTab('scans')}>
                    <div className="status-icon">❌</div>
                    <div className="status-content">
                      <h4>Beyond Repair</h4>
                      <div className="status-value">{scanStats.beyondRepair}</div>
                      <div className="status-percentage">
                        {scanStats.totalScans > 0 ? Math.round((scanStats.beyondRepair / scanStats.totalScans) * 100) : 0}%
                      </div>
                      <div className="status-bar">
                        <div 
                          className="status-fill" 
                          style={{width: `${scanStats.totalScans > 0 ? (scanStats.beyondRepair / scanStats.totalScans) * 100 : 0}%`}}
                        ></div>
                      </div>
                      <div className="click-hint">👆 Click to View</div>
                    </div>
                  </div>
                </div>
              </div>

              {Object.keys(departmentStats).length > 0 && (
                <div className="department-stats">
                  <h3>🏢 Department Statistics</h3>
                  <div className="department-grid">
                    {Object.entries(departmentStats).map(([dept, count]) => (
                      <div key={dept} className="department-card clickable" onClick={() => setActiveTab('users')}>
                        <div className="department-name">{dept}</div>
                        <div className="department-count">{count} technicians</div>
                        <div className="click-hint">👆 Click to View</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-section">
              <div className="section-header">
                <h2>👥 Technician Management</h2>
                <div className="section-actions">
                  <button 
                    className="add-user-btn"
                    onClick={() => setAddTechnicianModalOpen(true)}
                  >
                    ➕ Add Technician
                  </button>
                  <button 
                    className="export-btn"
                    onClick={generateAllTechniciansPDFReport}
                  >
                    📥 Export List
                  </button>
                </div>
              </div>
              
              {/* Technician Statistics */}
              <div className="technician-stats-panel">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>Total Technicians</h3>
                    <div className="stat-value">{users.length}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏢</div>
                  <div className="stat-content">
                    <h3>Departments</h3>
                    <div className="stat-value">{new Set(users.map(u => u.department)).size}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>Active</h3>
                    <div className="stat-value">{users.length}</div>
                  </div>
                </div>
              </div>
              
              {/* Filter Panel */}
              <div className="filter-panel">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>🔍 Search Technician:</label>
                    <input
                      type="text"
                      placeholder="Search by name or username..."
                      value={technicianFilters.search}
                      onChange={(e) => handleTechnicianFilterChange('search', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label>🏢 Filter by Department:</label>
                    <select 
                      className="filter-input"
                      value={technicianFilters.department}
                      onChange={(e) => handleTechnicianFilterChange('department', e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {Array.from(new Set(users.map(u => u.department))).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filter-actions">
                    <button 
                      className="clear-filters-btn"
                      onClick={clearTechnicianFilters}
                    >
                      🗑️ Clear Filters
                    </button>
                  </div>
                </div>
                
                {/* Filter Summary */}
                {(technicianFilters.search || technicianFilters.department) && (
                  <div className="filter-summary">
                    <span className="filter-label">Active Filters:</span>
                    {technicianFilters.search && (
                      <span className="filter-tag">Search: {technicianFilters.search}</span>
                    )}
                    {technicianFilters.department && (
                      <span className="filter-tag">Department: {technicianFilters.department}</span>
                    )}
                    <span className="filter-count">
                      Showing {filteredTechnicians.length} of {users.length} technicians
                    </span>
                  </div>
                )}
              </div>
              
              {/* Technicians Grid */}
              <div className="technicians-container">
                {filteredTechnicians.length === 0 ? (
                  <div className="no-data">
                    <div className="no-data-icon">👥</div>
                    <h3>No Technicians Found</h3>
                    <p>
                      {users.length === 0 
                        ? 'Add your first technician to get started with the system.'
                        : 'No technicians match the current filters. Try adjusting your search criteria.'
                      }
                    </p>
                    {users.length === 0 && (
                      <button 
                        className="add-first-btn"
                        onClick={() => setAddTechnicianModalOpen(true)}
                      >
                        ➕ Add First Technician
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="technicians-grid">
                    {filteredTechnicians.map(user => (
                      <div key={user._id} className="technician-card">
                        <div className="technician-header">
                          <div className="technician-avatar">
                            <span className="avatar-text">
                              {user.username ? user.username.charAt(0).toUpperCase() : 'T'}
                            </span>
                          </div>
                          <div className="technician-status">
                            <span className="status-badge active">Active</span>
                          </div>
                        </div>
                        
                        <div className="technician-info">
                          <h3 className="technician-name">{user.username || 'Unknown'}</h3>
                          <p className="technician-department">
                            <span className="info-icon">🏢</span>
                            {user.department || 'No Department'}
                          </p>
                          <p className="technician-role">
                            <span className="info-icon">👨‍💼</span>
                            Technician
                          </p>
                          <p className="technician-id">
                            <span className="info-icon">🆔</span>
                            ID: {user._id?.slice(-8) || 'Unknown'}
                          </p>
                        </div>
                        

                        
                        <div className="technician-actions">
                          
                          <button 
                            className="action-btn secondary" 
                            title="Edit Technician"
                            onClick={() => handleEditTechnician(user)}
                          >
                            <span className="btn-icon">✏️</span>
                            <span className="btn-text">Edit</span>
                          </button>
                          <button 
                            className="action-btn danger" 
                            title="Delete Technician"
                            onClick={() => handleDeleteTechnician(user)}
                          >
                            <span className="btn-icon">🗑️</span>
                            <span className="btn-text">Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}





















          {activeTab === 'scans' && (
            <div className="scans-section">
              <div className="section-header">
                <h2>📱 Scan History</h2>
                <div className="section-actions">
                  <button className="filter-btn">
                    🔍 Advanced Filter
                  </button>
                  <button 
                    className="export-btn"
                    onClick={generateAllScanHistoryPDFReport}
                  >
                    📥 Export Data
                  </button>
                </div>
              </div>
              
              {/* Filter Panel */}
              <div className="filter-panel">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>👨‍💼 Technician:</label>
                    <input
                      type="text"
                      placeholder="Search by technician name..."
                      value={scanHistoryFilters.technician}
                      onChange={(e) => handleScanHistoryFilterChange('technician', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label>🏢 Department:</label>
                    <input
                      type="text"
                      placeholder="Search by department..."
                      value={scanHistoryFilters.department}
                      onChange={(e) => handleScanHistoryFilterChange('department', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label>📊 Status:</label>
                    <select
                      value={scanHistoryFilters.status}
                      onChange={(e) => handleScanHistoryFilterChange('status', e.target.value)}
                      className="filter-input"
                    >
                      <option value="">All Statuses</option>
                      <option value="Healthy">Healthy</option>
                      <option value="Reparable">Reparable</option>
                      <option value="Beyond Repair">Beyond Repair</option>
                    </select>
                  </div>
                  
                  <div className="filter-actions">
                    <button 
                      className="clear-filters-btn"
                      onClick={clearScanHistoryFilters}
                    >
                      🗑️ Clear Filters
                    </button>
                  </div>
                </div>
                
                {/* Filter Summary */}
                {(scanHistoryFilters.technician || scanHistoryFilters.department || scanHistoryFilters.status) && (
                  <div className="filter-summary">
                    <span className="filter-label">Active Filters:</span>
                    {scanHistoryFilters.technician && (
                      <span className="filter-tag">Technician: {scanHistoryFilters.technician}</span>
                    )}
                    {scanHistoryFilters.department && (
                      <span className="filter-tag">Department: {scanHistoryFilters.department}</span>
                    )}
                    {scanHistoryFilters.status && (
                      <span className="filter-tag">Status: {scanHistoryFilters.status}</span>
                    )}
                    <span className="filter-count">
                      Showing {Object.values(filteredGroupedScans).flat().length} of {Object.values(groupedScans).flat().length} scans
                    </span>
                  </div>
                )}
              </div>

              {Object.keys(filteredGroupedScans).length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">📱</div>
                  <h3>No scans found</h3>
                  <p>
                    {Object.keys(groupedScans).length === 0 
                      ? 'When technicians perform scans, they will appear here.'
                      : 'No scans match the current filters. Try adjusting your search criteria.'
                    }
                  </p>
                </div>
              ) : (
                <div className="scans-container">
                  {Object.entries(filteredGroupedScans).map(([technician, scans]) => (
                    <div key={technician} className="technician-scans">
                      <div className="technician-header">
                        <h3>👨‍💼 {technician}</h3>
                        <div className="technician-stats">
                          <span className="stat healthy">✅ {scans.filter(s => s.status === 'Healthy').length}</span>
                          <span className="stat reparable">🔧 {scans.filter(s => s.status === 'Reparable').length}</span>
                          <span className="stat beyond-repair">❌ {scans.filter(s => s.status === 'Beyond Repair').length}</span>
                        </div>
                      </div>
                      <div className="scans-grid">
                        {scans.map((scan, idx) => (
                          <div key={idx} className="scan-card" style={{borderLeftColor: getStatusColor(scan.status)}}>
                            <div className="scan-header">
                              <span className="scan-barcode">📋 {scan.barcode}</span>
                              <span className="scan-status" style={{color: getStatusColor(scan.status)}}>
                                {getStatusIcon(scan.status)} {scan.status}
                              </span>
                            </div>
                            <div className="scan-time">
                              📅 {new Date(scan.timestamp || scan.date).toLocaleString()}
                            </div>
                            <div className="scan-actions">
                              <button 
                                className="scan-action-btn"
                                onClick={() => {
                                  console.log('🔍 Selected Scan:', scan);
                                  console.log('🔍 Users Array:', users);
                                  console.log('🔍 Scan Keys:', Object.keys(scan));
                                  setSelectedScan({
                                    ...scan,
                                    technicianDisplay: scan.technician || 'Unknown'
                                  });
                                  setScanModalOpen(true);
                                }}
                              >
                                👁️ View
                              </button>
                              
                              <button 
                                className="scan-action-btn"
                                onClick={() => handleExportClick(scan)}
                              >
                                📤 Export
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}



















          {activeTab === 'sessions' && (
            <div className="sessions-section">
              <div className="section-header">
                <h2>⏱️ Active Sessions</h2>
                <div className="section-actions">
                  <button className="filter-btn">
                    🔍 Filter Sessions
                  </button>
                  <button 
                    className="export-btn"
                    onClick={generateAllSessionsPDFReport}
                  >
                    📥 Export Data
                  </button>
                </div>
              </div>
              
              {/* Filter Panel */}
              <div className="filter-panel">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>👨‍💼 Technician:</label>
                    <input
                      type="text"
                      placeholder="Search by technician name..."
                      value={sessionFilters.technician}
                      onChange={(e) => handleSessionFilterChange('technician', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label>📅 Day:</label>
                    <input
                      type="date"
                      value={sessionFilters.day}
                      onChange={(e) => handleSessionFilterChange('day', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label>🏢 Department:</label>
                    <input
                      type="text"
                      placeholder="Search by department..."
                      value={sessionFilters.department}
                      onChange={(e) => handleSessionFilterChange('department', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  
                  <div className="filter-actions">
                    <button 
                      className="clear-filters-btn"
                      onClick={clearSessionFilters}
                    >
                      🗑️ Clear Filters
                    </button>
                  </div>
                </div>
                
                {/* Filter Summary */}
                {(sessionFilters.technician || sessionFilters.day || sessionFilters.department) && (
                  <div className="filter-summary">
                    <span className="filter-label">Active Filters:</span>
                    {sessionFilters.technician && (
                      <span className="filter-tag">Technician: {sessionFilters.technician}</span>
                    )}
                    {sessionFilters.day && (
                      <span className="filter-tag">Day: {new Date(sessionFilters.day).toLocaleDateString()}</span>
                    )}
                    {sessionFilters.department && (
                      <span className="filter-tag">Department: {sessionFilters.department}</span>
                    )}
                    <span className="filter-count">
                      Showing {filteredSessionsData.length} of {sessions.length} sessions
                    </span>
                  </div>
                )}
              </div>
              {filteredSessionsData.length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">⏱️</div>
                  <h3>No sessions found</h3>
                  <p>
                    {sessions.length === 0 
                      ? 'When technicians start scanning sessions, they will appear here.'
                      : 'No sessions match the current filters. Try adjusting your search criteria.'
                    }
                  </p>
                </div>
              ) : (
                <div className="sessions-grid">
                  {filteredSessionsData.map((session, idx) => (
                    <div key={idx} className="session-card">
                      <div className="session-header">
                        <h3>📋 Session {session._id?.slice(-8) || idx + 1}</h3>
                        <span className={`session-status ${session.endTime ? 'completed' : 'active'}`}>
                          {session.endTime ? '✅ Completed' : '🔄 Active'}
                        </span>
                      </div>
                      <div className="session-details">
                        <p><strong>👨‍💼 Technician:</strong> {session.technician}</p>
                        <p><strong>🏢 Department:</strong> {session.department}</p>
                        <p><strong>🕐 Start Time:</strong> {new Date(session.startTime).toLocaleString()}</p>
                        {session.endTime && (
                          <p><strong>🕐 End Time:</strong> {new Date(session.endTime).toLocaleString()}</p>
                        )}
                        <p><strong>📱 Scan Count:</strong> {session.scanCount || 0}</p>
                      </div>
                      <div className="session-actions">
                        <button 
                          className="session-action-btn"
                          onClick={() => {
                            setSelectedSession(session);
                            setSessionModalOpen(true);
                          }}
                        >
                          👁️ View Details
                        </button>
                        
                        <button 
                          className="session-action-btn"
                          onClick={() => handleSessionExportClick(session)}
                        >
                          📤 Export
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="notifications-section">
              {selectedNotificationView ? (
                <div className="notification-detail-view">
                  <div className="section-header">
                    <button 
                      className="back-btn"
                      onClick={() => setSelectedNotificationView(null)}
                    >
                      ← Back to Notifications
                    </button>
                    <div className="section-actions">
                      <button 
                        className="export-btn"
                        onClick={handleNotificationExportClick}
                      >
                        📥 Export Screens
                      </button>
                    </div>
                  </div>
                  
                  <div className="notification-detail-header">
                    <div className="detail-icon">{selectedNotificationView.icon}</div>
                    <div className="detail-info">
                      <h2>{selectedNotificationView.title}</h2>
                      <p>{selectedNotificationView.message}</p>
                      <span className="detail-time">
                        {new Date(selectedNotificationView.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-count">
                      <span className="count-number">{selectedNotificationView.count}</span>
                      <span className="count-label">Screens</span>
                    </div>
                  </div>

                  <div className="screens-grid">
                    <h3>📱 Screens in this Category</h3>
                    {selectedNotificationView.scans.length === 0 ? (
                      <div className="no-screens">
                        <p>No screens found in this category.</p>
                      </div>
                    ) : (
                      <div className="screens-list">
                        {selectedNotificationView.scans.map((scan, index) => (
                          <div key={index} className="screen-card">
                            <div className="screen-header">
                              <div className="screen-barcode">
                                <span className="barcode-icon">📋</span>
                                <span className="barcode-text">{scan.barcode || `Screen ${index + 1}`}</span>
                              </div>
                              <div className="screen-status">
                                <span className={`status-badge ${selectedNotificationView.type}`}>
                                  {selectedNotificationView.icon} {selectedNotificationView.title}
                                </span>
                              </div>
                            </div>
                            <div className="screen-details">
                              <div className="detail-row">
                                <span className="detail-label">Technician:</span>
                                <span className="detail-value">
                                  {scan.technicianDisplay || scan.technician || 'Unknown'}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Department:</span>
                                <span className="detail-value">
                                  {(() => {
                                    // First try to get department from scan data directly
                                    if (scan.department) {
                                      return scan.department;
                                    }
                                    // Then try to find by technicianDisplay (which is the username)
                                    const foundUser = users.find(u => u.username === scan.technicianDisplay);
                                    if (foundUser) {
                                      return foundUser.department;
                                    }
                                    // Finally try to find by technician field
                                    const foundUserByTechnician = users.find(u => u.username === scan.technician);
                                    if (foundUserByTechnician) {
                                      return foundUserByTechnician.department;
                                    }
                                    return 'Unknown';
                                  })()}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Scan Time:</span>
                                <span className="detail-value">
                                  {new Date(scan.timestamp || scan.date).toLocaleString()}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Status:</span>
                                <span className="detail-value status-text">
                                  {scan.status}
                                </span>
                              </div>
                            </div>
                            <div className="screen-actions">
                              
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="section-header">
                    <h2>🔔 Notifications</h2>
                    <div className="section-actions">
                      <button className="mark-all-read-btn">
                        ✅ Mark All Read
                      </button>
                      <button className="clear-all-btn">
                        🗑️ Clear All
                      </button>
                    </div>
                  </div>
                  {generateNotifications.length === 0 ? (
                    <div className="no-data">
                      <div className="no-data-icon">🔔</div>
                      <h3>No notifications</h3>
                      <p>System notifications will appear here.</p>
                    </div>
                  ) : (
                    <div className="notifications-list">
                      {generateNotifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`notification-card ${notification.type} clickable`}
                          onClick={() => {
                            setSelectedNotificationView(notification);
                            if (!notificationsViewed) {
                              setNotificationsViewed(true);
                            }
                          }}
                        >
                          <div className="notification-icon">{notification.icon}</div>
                          <div className="notification-content">
                            <h4>{notification.title}</h4>
                            <p>{notification.message}</p>
                            <span className="notification-time">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="notification-count-badge">
                            {notification.count}
                          </div>
                          <div className="click-hint">👆 Click to View Screens</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Scan Detail Modal */}
      {scanModalOpen && selectedScan && (
        <div className="modal-overlay" onClick={() => setScanModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Scan Details</h3>
              <button className="modal-close" onClick={() => setScanModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <span className="modal-label">👨‍💼 Technician:</span>
                <span className="modal-value">{selectedScan.technicianDisplay}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">📋 Barcode:</span>
                <span className="modal-value">{selectedScan.barcode || 'N/A'}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">📊 Status:</span>
                <span className="modal-value" style={{color: getStatusColor(selectedScan.status)}}>
                  {getStatusIcon(selectedScan.status)} {selectedScan.status}
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-label">🕐 Scan Time:</span>
                <span className="modal-value">{new Date(selectedScan.timestamp || selectedScan.date).toLocaleString()}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">🏢 Department:</span>
                <span className="modal-value">
                  {(() => {
                    const foundUser = users.find(u => u.username === selectedScan.technicianDisplay);
                    console.log('🔍 Department Lookup:', {
                      technicianDisplay: selectedScan.technicianDisplay,
                      foundUser: foundUser,
                      allUsers: users.map(u => ({ username: u.username, department: u.department }))
                    });
                    return selectedScan.department || foundUser?.department || 'Unknown';
                  })()}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn" onClick={() => setScanModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation Modal */}
      {exportModalOpen && selectedScanForExport && (
        <div className="modal-overlay" onClick={() => setExportModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📥 Download Scan Report</h3>
              <button className="modal-close" onClick={() => setExportModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              {console.log('🔍 Modal body rendering with scan:', selectedScanForExport)}
              <div className="export-confirmation">
                <div className="export-icon">📄</div>
                <h4>Download Scan Report</h4>
                <p>Are you sure you want to download a report for this scan?</p>
                
                <div className="scan-preview">
                  <div className="preview-row">
                    <span className="preview-label">📱 Barcode:</span>
                    <span className="preview-value">{selectedScanForExport.barcode}</span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">📊 Status:</span>
                    <span className="preview-value" style={{color: getStatusColor(selectedScanForExport.status)}}>
                      {getStatusIcon(selectedScanForExport.status)} {selectedScanForExport.status}
                    </span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">👨‍💼 Technician:</span>
                    <span className="preview-value">{selectedScanForExport.technician || 'Unknown'}</span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">🏢 Department:</span>
                    <span className="preview-value">{selectedScanForExport.department || 'Unknown'}</span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">🕐 Scan Time:</span>
                    <span className="preview-value">{new Date(selectedScanForExport.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="export-note">
                  <p>📝 <strong>Note:</strong> The report will be downloaded as a PDF file directly to your computer.</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn secondary" 
                onClick={() => setExportModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn primary" 
                onClick={handleExportConfirm}
              >
                📥 Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      {sessionModalOpen && selectedSession && (
        <div className="modal-overlay" onClick={() => setSessionModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Session Summary</h3>
              <button className="modal-close" onClick={() => setSessionModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div 
                className="scan-summary"
                dangerouslySetInnerHTML={{ __html: generateSessionSummary(selectedSession) }}
                style={{
                  lineHeight: '1.6',
                  fontSize: '14px',
                  color: '#2c3e50'
                }}
              />
            </div>
            <div className="modal-footer">
              <button className="modal-btn" onClick={() => setSessionModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Session Export Confirmation Modal */}
      {sessionExportModalOpen && selectedSessionForExport && (
        <div className="modal-overlay" onClick={() => setSessionExportModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📥 Download Session Report</h3>
              <button className="modal-close" onClick={() => setSessionExportModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="export-confirmation">
                <div className="export-icon">📄</div>
                <h4>Download Session Report</h4>
                <p>Are you sure you want to download a report for this session?</p>
                
                <div className="scan-preview">
                  <div className="preview-row">
                    <span className="preview-label">📋 Session ID:</span>
                    <span className="preview-value">{selectedSessionForExport._id?.slice(-8)}</span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">👨‍💼 Technician:</span>
                    <span className="preview-value">{selectedSessionForExport.technician || 'Unknown'}</span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">🏢 Department:</span>
                    <span className="preview-value">{selectedSessionForExport.department || 'Unknown'}</span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">📱 Total Scans:</span>
                    <span className="preview-value">{selectedSessionForExport.scanCount || 0}</span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">🕐 Start Time:</span>
                    <span className="preview-value">{new Date(selectedSessionForExport.startTime).toLocaleString()}</span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">🕐 End Time:</span>
                    <span className="preview-value">
                      {selectedSessionForExport.endTime 
                        ? new Date(selectedSessionForExport.endTime).toLocaleString()
                        : 'Session still active'
                      }
                    </span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">📊 Status:</span>
                    <span className="preview-value" style={{color: selectedSessionForExport.endTime ? '#27ae60' : '#f39c12'}}>
                      {selectedSessionForExport.endTime ? '✅ Completed' : '🔄 Active'}
                    </span>
                  </div>
                </div>
                
                <div className="export-note">
                  <p>📝 <strong>Note:</strong> The report will be downloaded as a PDF file directly to your computer.</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn secondary" 
                onClick={() => setSessionExportModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn primary" 
                onClick={handleSessionExportConfirm}
              >
                📥 Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Technician Modal */}
      {addTechnicianModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content add-technician-modal">
            <div className="modal-header">
              <h2>👥 Add New Technician</h2>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setAddTechnicianModalOpen(false);
                  resetTechnicianForm();
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-description">
                <p>Create a new technician account that can log in to the mobile app.</p>
              </div>
              
              <div className="form-group">
                <label>👤 Username *</label>
                <input
                  type="text"
                  placeholder="Enter username (min 3 characters)"
                  value={newTechnician.username}
                  onChange={(e) => handleTechnicianInputChange('username', e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>📧 Email *</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newTechnician.email}
                  onChange={(e) => handleTechnicianInputChange('email', e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>🏢 Department *</label>
                <input
                  type="text"
                  placeholder="Enter department"
                  value={newTechnician.department}
                  onChange={(e) => handleTechnicianInputChange('department', e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>🔒 Password *</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password (min 6 characters)"
                    value={newTechnician.password}
                    onChange={(e) => handleTechnicianInputChange('password', e.target.value)}
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>🔒 Confirm Password *</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={newTechnician.confirmPassword}
                    onChange={(e) => handleTechnicianInputChange('confirmPassword', e.target.value)}
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-btn secondary"
                onClick={() => {
                  setAddTechnicianModalOpen(false);
                  resetTechnicianForm();
                }}
                disabled={isAddingTechnician}
              >
                Cancel
              </button>
              <button 
                className="modal-btn primary"
                onClick={handleAddTechnician}
                disabled={isAddingTechnician}
              >
                {isAddingTechnician ? (
                  <>
                    <span className="loading-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create Technician'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Technician Modal */}
      {editTechnicianModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content add-technician-modal">
            <div className="modal-header">
              <h2>✏️ Edit Technician</h2>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setEditTechnicianModalOpen(false);
                  resetEditTechnicianForm();
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-description">
                <p>Update technician information. Leave password fields empty to keep the current password.</p>
              </div>
              
              <div className="form-group">
                <label>👤 Username *</label>
                <input
                  type="text"
                  placeholder="Enter username (min 3 characters)"
                  value={editingTechnician.username}
                  onChange={(e) => handleEditTechnicianInputChange('username', e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>📧 Email *</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={editingTechnician.email}
                  onChange={(e) => handleEditTechnicianInputChange('email', e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>🏢 Department *</label>
                <input
                  type="text"
                  placeholder="Enter department"
                  value={editingTechnician.department}
                  onChange={(e) => handleEditTechnicianInputChange('department', e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>🔒 New Password (Optional)</label>
                <div className="password-input-container">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    placeholder="Enter new password (min 6 characters) or leave empty"
                    value={editingTechnician.password}
                    onChange={(e) => handleEditTechnicianInputChange('password', e.target.value)}
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                  >
                    {showEditPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>🔒 Confirm New Password</label>
                <div className="password-input-container">
                  <input
                    type={showEditConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={editingTechnician.confirmPassword}
                    onChange={(e) => handleEditTechnicianInputChange('confirmPassword', e.target.value)}
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}
                  >
                    {showEditConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-btn secondary"
                onClick={() => {
                  setEditTechnicianModalOpen(false);
                  resetEditTechnicianForm();
                }}
                disabled={isEditingTechnician}
              >
                Cancel
              </button>
              <button 
                className="modal-btn primary"
                onClick={handleEditTechnicianSubmit}
                disabled={isEditingTechnician}
              >
                {isEditingTechnician ? (
                  <>
                    <span className="loading-spinner"></span>
                    Updating Technician...
                  </>
                ) : (
                  'Update Technician'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Technician Confirmation Modal */}
      {deleteTechnicianModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirmation-modal">
            <div className="modal-header">
              <h2>⚠️ Delete Technician</h2>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setDeleteTechnicianModalOpen(false);
                  resetDeleteTechnicianForm();
                }}
                disabled={isDeletingTechnician}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning">
                <div className="warning-icon">⚠️</div>
                <h3>Are you sure you want to delete this technician?</h3>
                <p>This action cannot be undone. The technician will be permanently removed from the system.</p>
              </div>
              
              <div className="technician-details">
                <div className="detail-row">
                  <span className="detail-label">👤 Username:</span>
                  <span className="detail-value">{deletingTechnician.username}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🏢 Department:</span>
                  <span className="detail-value">{deletingTechnician.department}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🆔 ID:</span>
                  <span className="detail-value">{deletingTechnician._id?.slice(-8)}</span>
                </div>
              </div>
              
              <div className="delete-consequences">
                <h4>⚠️ Consequences:</h4>
                <ul>
                  <li>• The technician will no longer be able to log in to the mobile app</li>
                  <li>• All their session data will remain but will show "Unknown" technician</li>
                  <li>• This action cannot be reversed</li>
                  <li>• You will need to create a new technician account if needed</li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-btn secondary"
                onClick={() => {
                  setDeleteTechnicianModalOpen(false);
                  resetDeleteTechnicianForm();
                }}
                disabled={isDeletingTechnician}
              >
                Cancel
              </button>
              <button 
                className="modal-btn danger"
                onClick={handleDeleteTechnicianConfirm}
                disabled={isDeletingTechnician}
              >
                {isDeletingTechnician ? (
                  <>
                    <span className="loading-spinner"></span>
                    Deleting Technician...
                  </>
                ) : (
                  '🗑️ Delete Technician'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Export Confirmation Modal */}
      {notificationExportModalOpen && selectedNotificationView && (
        <div className="modal-overlay" onClick={() => setNotificationExportModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📥 Download Notification Screens Report</h3>
              <button className="modal-close" onClick={() => setNotificationExportModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="export-confirmation">
                <div className="export-icon">📄</div>
                <h4>Download Notification Screens Report</h4>
                <p>Are you sure you want to download a report for all screens in this notification?</p>
                
                <div className="scan-preview">
                  <div className="preview-row">
                    <span className="preview-label">📋 Notification:</span>
                    <span className="preview-value">{selectedNotificationView.title}</span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">📊 Status:</span>
                    <span className="preview-value" style={{color: selectedNotificationView.type === 'success' ? '#27ae60' : selectedNotificationView.type === 'warning' ? '#f39c12' : '#e74c3c'}}>
                      {selectedNotificationView.type === 'success' ? '✅ Healthy' : selectedNotificationView.type === 'warning' ? '🔧 Reparable' : '❌ Beyond Repair'}
                    </span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">📱 Total Screens:</span>
                    <span className="preview-value">{selectedNotificationView.scans.length}</span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">📝 Message:</span>
                    <span className="preview-value">{selectedNotificationView.message}</span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">🕐 Generated:</span>
                    <span className="preview-value">{new Date(selectedNotificationView.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="export-note">
                  <p>📝 <strong>Note:</strong> The report will be downloaded as a PDF file directly to your computer.</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn secondary" 
                onClick={() => setNotificationExportModalOpen(false)}
                disabled={isExportingNotificationScreens}
              >
                Cancel
              </button>
              <button 
                className="modal-btn primary" 
                onClick={handleNotificationExportConfirm}
                disabled={isExportingNotificationScreens}
              >
                {isExportingNotificationScreens ? (
                  <>
                    <span className="loading-spinner"></span>
                    Generating Report...
                  </>
                ) : (
                  '📥 Download Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content bulk-delete-modal">
            <div className="modal-header">
              <h2>🗑️ Bulk Delete Screens</h2>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setBulkDeleteModalOpen(false);
                  resetBulkDeleteForm();
                }}
                disabled={isDeletingScans}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning">
                <div className="warning-icon">⚠️</div>
                <h3>Select Screens to Delete</h3>
                <p>Choose the screens you want to permanently delete from the system. This action cannot be undone.</p>
              </div>
              
              <div className="bulk-delete-controls">
                <div className="select-all-section">
                  <label className="select-all-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedScansForDelete.length === scanHistory.length && scanHistory.length > 0}
                      onChange={handleSelectAllScans}
                      disabled={isDeletingScans}
                    />
                    <span className="checkbox-label">
                      Select All ({scanHistory.length} screens)
                    </span>
                  </label>
                  <span className="selected-count">
                    {selectedScansForDelete.length} of {scanHistory.length} selected
                  </span>
                </div>
              </div>
              
              <div className="scans-selection-list">
                <h4>📱 Available Screens</h4>
                {scanHistory.length === 0 ? (
                  <div className="no-scans">
                    <p>No screens available for deletion.</p>
                  </div>
                ) : (
                  <div className="scans-grid">
                    {scanHistory.map((scan) => (
                      <div key={scan._id} className="scan-selection-card">
                        <label className="scan-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedScansForDelete.includes(scan._id)}
                            onChange={() => handleScanSelection(scan._id)}
                            disabled={isDeletingScans}
                          />
                          <span className="checkbox-custom"></span>
                        </label>
                        
                        <div className="scan-info">
                          <div className="scan-header">
                            <span className="scan-barcode">{scan.barcode || 'No Barcode'}</span>
                            <span className={`scan-status ${scan.status?.toLowerCase()}`}>
                              {scan.status === 'Healthy' ? '✅' : scan.status === 'Reparable' ? '🔧' : '❌'} {scan.status}
                            </span>
                          </div>
                          
                          <div className="scan-details">
                            <span className="scan-technician">
                              👨‍💼 {scan.technicianDisplay || scan.technician || 'Unknown'}
                            </span>
                            <span className="scan-department">
                              🏢 {(() => {
                                if (scan.department) return scan.department;
                                const foundUser = users.find(u => u.username === scan.technicianDisplay);
                                if (foundUser) return foundUser.department;
                                const foundUserByTechnician = users.find(u => u.username === scan.technician);
                                if (foundUserByTechnician) return foundUserByTechnician.department;
                                return 'Unknown';
                              })()}
                            </span>
                            <span className="scan-time">
                              🕐 {new Date(scan.timestamp || scan.date).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-btn secondary"
                onClick={() => {
                  setBulkDeleteModalOpen(false);
                  resetBulkDeleteForm();
                }}
                disabled={isDeletingScans}
              >
                Cancel
              </button>
              <button 
                className="modal-btn danger"
                onClick={handleBulkDeleteConfirm}
                disabled={isDeletingScans || selectedScansForDelete.length === 0}
              >
                {isDeletingScans ? (
                  <>
                    <span className="loading-spinner"></span>
                    Deleting Screens...
                  </>
                ) : (
                  `🗑️ Delete ${selectedScansForDelete.length} Screen${selectedScansForDelete.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );}

export default HomeDashboard;
