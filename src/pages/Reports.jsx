import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaFileExcel, FaFilePdf, FaDownload } from "react-icons/fa";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getAuth } from "firebase/auth";
import * as XLSX from "xlsx";
import { app } from "../services/firebase";

const db = getFirestore(app); // Using 'app' instead of 'firebaseApp'

const Reports = () => {
  const [reportType, setReportType] = useState("sales");
  const [timeRange, setTimeRange] = useState("thisMonth");
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [fileFormat, setFileFormat] = useState("excel");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (timeRange === "thisMonth") {
      setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
      setEndDate(new Date());
    } else if (timeRange === "lastMonth") {
      setStartDate(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
      setEndDate(new Date(new Date().getFullYear(), new Date().getMonth(), 0));
    }
  }, [timeRange]);

  const downloadReport = async () => {
    setIsLoading(true);
    try {
      const auth = getAuth(app);
      const userId = auth.currentUser?.uid;

      if (!userId) {
        alert("You must be logged in to download reports.");
        setIsLoading(false);
        return;
      }

      let collectionPath;
      switch (reportType) {
        case "sales":
          collectionPath = `users/${userId}/sales`;
          break;
        case "purchases":
          collectionPath = `users/${userId}/purchases`;
          break;
        case "expenses":
          collectionPath = `users/${userId}/expenses`;
          break;
        default:
          collectionPath = `users/${userId}/sales`;
      }

      const reportRef = collection(db, collectionPath);
      let q;

      if (timeRange === "custom") {
        // Format dates to start and end of day for custom range
        const startDateTime = new Date(startDate.setHours(0, 0, 0, 0));
        const endDateTime = new Date(endDate.setHours(23, 59, 59, 999));
        
        q = query(
          reportRef,
          where("date", ">=", startDateTime),
          where("date", "<=", endDateTime)
        );
      } else {
        // Fetch all records when not using custom date range
        q = query(reportRef);
      }
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          date: docData.date?.toDate?.()?.toLocaleDateString() || docData.date
        };
      });

      // Sort data by date if needed
      data.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (data.length === 0) {
        alert("No data found for the selected period.");
        return;
      }

      if (fileFormat === "excel") {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, `${reportType}-report.xlsx`);
      } else if (fileFormat === "pdf") {
        const doc = new jsPDF('landscape'); // Change to landscape for more width
        
        // Format headers for better readability
        const headers = Object.keys(data[0]).map(header => {
          const formatted = header.charAt(0).toUpperCase() + header.slice(1);
          return formatted.replace(/([A-Z])/g, ' $1').trim(); // Add spaces before capital letters
        });

        // Format data rows
        const rows = data.map((entry) => {
          return headers.map(header => {
            const key = header.toLowerCase().replace(/\s/g, '');
            const value = entry[key];
            // Format numbers and currency values
            if (typeof value === 'number') {
              return value.toLocaleString('en-US', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              });
            }
            return value || '';
          });
        });

        // Configure table
        autoTable(doc, {
          head: [headers],
          body: rows,
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 4,
            overflow: 'linebreak',
            halign: 'left',
            valign: 'middle',
            lineWidth: 0.5,
          },
          columnStyles: {
            0: { cellWidth: 40 }, // ID column
            1: { cellWidth: 30 }, // Date column
            2: { cellWidth: 35 }, // Name/Description
            3: { cellWidth: 25, halign: 'right' }, // Amount
            4: { cellWidth: 35 }, // Other columns
            // Add more specific column styles as needed
          },
          headStyles: {
            fillColor: [51, 122, 183],
            textColor: 255,
            fontSize: 11,
            fontStyle: 'bold',
            halign: 'center',
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: 20, left: 10, right: 10 },
          didDrawPage: function(data) {
            // Add title to each page
            doc.setFontSize(15);
            doc.setTextColor(40);
            doc.text(
              `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 
              15, 
              15
            );
          }
        });
        
        doc.save(`${reportType}-report.pdf`);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Error generating report: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-primary mb-8">Generate Reports</h1>

      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2 border rounded-md bg-gray-50 hover:bg-gray-100"
            >
              <option value="sales">Sales</option>
              <option value="purchases">Purchases</option>
              <option value="expenses">Expenses</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full p-2 border rounded-md bg-gray-50 hover:bg-gray-100"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {timeRange === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                className="w-full p-2 border rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">End Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                className="w-full p-2 border rounded-md bg-gray-50"
              />
            </div>
          </div>
        )}

        <div className="format-selection flex gap-4">
          <button
            onClick={() => setFileFormat("excel")}
            className={`flex items-center gap-2 p-3 rounded-md border transition-all ${
              fileFormat === "excel"
                ? "bg-green-100 border-green-500 ring-2 ring-green-500"
                : "bg-white text-green-700 border-gray-300 hover:bg-green-50 hover:border-green-400"
            }`}
          >
            <FaFileExcel className="text-green-700" /> 
            <span className="text-green-700">Excel</span>
          </button>
          <button
            onClick={() => setFileFormat("pdf")}
            className={`flex items-center gap-2 p-3 rounded-md border transition-all ${
              fileFormat === "pdf"
                ? "bg-red-100 border-red-500 ring-2 ring-red-500"
                : "bg-white text-red-700 border-gray-300 hover:bg-red-50 hover:border-red-400"
            }`}
          >
            <FaFilePdf className="text-red-700" /> 
            <span className="text-red-700">PDF</span>
          </button>
        </div>

        <button
          onClick={downloadReport}
          disabled={isLoading}
          className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="animate-spin">↻</span>
          ) : (
            <>
              <FaDownload /> <span>Download Report</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Reports;
