import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function SafetyReports() {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    endDate: new Date().toISOString().split('T')[0] 
  });
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    averageResponseTime: 0,
  });

  useEffect(() => {
    fetchSafetyReports();
  }, []);

  const fetchSafetyReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "http://localhost:5000/api/sos/safety-report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dateRange),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setReports(data.report);
        
        const total = data.report.length;
        const resolved = data.report.filter(sos => sos.isResolved).length;
        const pending = total - resolved;
        
        let totalResponseTime = 0;
        let resolvedWithTime = 0;
        
        data.report.forEach(sos => {
          if (sos.isResolved && sos.resolvedAt && sos.createdAt) {
            const responseTime = new Date(sos.resolvedAt) - new Date(sos.createdAt);
            totalResponseTime += responseTime;
            resolvedWithTime++;
          }
        });
        
        const averageResponseTime = resolvedWithTime > 0 
          ? Math.floor(totalResponseTime / resolvedWithTime / (1000 * 60)) 
          : 0;
        
        setStats({ total, resolved, pending, averageResponseTime });
      } else {
        toast.error("Failed to fetch safety reports.");
      }
    } catch (error) {
      toast.error("Error fetching safety reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const handleGenerateReport = () => {
    fetchSafetyReports();
  };

  const exportToCsv = () => {
    if (reports.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const headers = ["User", "Email", "Message", "Location", "Status", "Created At", "Resolved At"];
    const csvRows = [headers];
    
    reports.forEach(report => {
      const row = [
        report.user || "Unknown",
        report.email || "Unknown",
        report.message || "",
        `${report.coordinates?.latitude || ""}, ${report.coordinates?.longitude || ""}`,
        report.isResolved ? "Resolved" : "Pending",
        new Date(report.createdAt).toLocaleString(),
        report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : "N/A"
      ];
      csvRows.push(row);
    });
    
    const csvContent = csvRows
      .map(row => row
        .map(cell => typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell)
        .join(',')
      )
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `safety_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Report exported successfully");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">Safety Reports</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Generate Report</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input 
              type="date" 
              name="startDate" 
              value={dateRange.startDate} 
              onChange={handleDateChange}
              className="border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input 
              type="date" 
              name="endDate" 
              value={dateRange.endDate} 
              onChange={handleDateChange}
              className="border rounded p-2"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleGenerateReport}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Generate
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm mb-1">Total SOS Cases</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm mb-1">Resolved Cases</h3>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm mb-1">Pending Cases</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm mb-1">Avg. Response Time</h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats.averageResponseTime} min
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">SOS Report Data</h2>
          <button 
            onClick={exportToCsv}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            disabled={reports.length === 0}
          >
            Export CSV
          </button>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No reports found for the selected date range</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{report.user}</td>
                    <td className="px-6 py-4">{report.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.coordinates ? 
                        `${report.coordinates.latitude}, ${report.coordinates.longitude}` : 
                        "N/A"
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        report.isResolved ? 
                          "bg-green-100 text-green-800" : 
                          "bg-yellow-100 text-yellow-800"
                      }`}>
                        {report.isResolved ? "Resolved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.resolvedAt ? 
                        new Date(report.resolvedAt).toLocaleString() : 
                        "N/A"
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}