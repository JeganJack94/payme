import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../services/firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getAuth } from "firebase/auth";

const db = getFirestore(app);
const expenseColors = ['#FF6384', '#36A2EB', '#FFCE56', '#00C49F', '#FF8042'];

const Dashboard = () => {
  const [range, setRange] = useState("thisMonth");
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    switch (range) {
      case "thisMonth":
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setEndDate(now);
        break;
      case "lastMonth":
        setStartDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        setEndDate(new Date(now.getFullYear(), now.getMonth(), 0));
        break;
      case "thisYear":
        setStartDate(new Date(now.getFullYear(), 0, 1));
        setEndDate(now);
        break;
      case "lastYear":
        setStartDate(new Date(now.getFullYear() - 1, 0, 1));
        setEndDate(new Date(now.getFullYear() - 1, 11, 31));
        break;
    }
  }, [range]);

  useEffect(() => {
    if (!userId) return;

    const fetchAndFilter = async (type, setter, dateField) => {
      const ref = collection(db, `users/${userId}/${type}`);
      const snapshot = await getDocs(ref);
      const rawData = snapshot.docs.map(doc => doc.data());
      const filtered = rawData.filter(item => {
        const dateStr = item[dateField];
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= startDate && d <= endDate;
      });
      setter(filtered);
    };

    fetchAndFilter("sales", setSales, "invoiceDate");
    fetchAndFilter("purchases", setPurchases, "purchaseDate");
    fetchAndFilter("expenses", setExpenses, "date");
  }, [startDate, endDate, userId]);

  const getTotal = (data) => data.reduce((acc, item) => acc + Number(item.total || item.amount || 0), 0);
  const profit = getTotal(sales) - (getTotal(purchases) + getTotal(expenses));

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthName = new Date(0, i).toLocaleString("default", { month: "short" });
    const getMonthlyTotal = (data, dateKey) => data
      .filter(item => new Date(item[dateKey]).getMonth() === i)
      .reduce((acc, cur) => acc + Number(cur.total || cur.amount || 0), 0);

    return {
      month: monthName,
      sales: getMonthlyTotal(sales, "invoiceDate"),
      purchases: getMonthlyTotal(purchases, "purchaseDate"),
      expenses: getMonthlyTotal(expenses, "date")
    };
  });

  const expenseCategories = expenses.reduce((acc, item) => {
    const category = item.category || "Other";
    acc[category] = (acc[category] || 0) + Number(item.amount);
    return acc;
  }, {});

  const expensePieData = Object.entries(expenseCategories).map(([name, value], idx) => ({
    name,
    value,
    color: expenseColors[idx % expenseColors.length]
  }));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#e82c2a] mb-6 sm:mb-8">Dashboard</h1>

      <div className="flex flex-col sm:flex-row gap-4 flex-wrap mb-6">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="p-2 border rounded-md bg-gray-100 w-full sm:w-auto"
        >
          <option value="thisMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="thisYear">This Year</option>
          <option value="lastYear">Last Year</option>
          <option value="custom">Custom</option>
        </select>

        {range === "custom" && (
          <div className="flex flex-col sm:flex-row gap-4">
            <DatePicker selected={startDate} onChange={setStartDate} className="p-2 border rounded-md w-full sm:w-auto" />
            <DatePicker selected={endDate} onChange={setEndDate} className="p-2 border rounded-md w-full sm:w-auto" />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {[
          { label: "Total Sales", value: getTotal(sales), bg: "bg-green-100", text: "text-green-800" },
          { label: "Total Purchases", value: getTotal(purchases), bg: "bg-yellow-100", text: "text-yellow-800" },
          { label: "Total Expenses", value: getTotal(expenses), bg: "bg-red-100", text: "text-red-800" },
          { label: "Profit", value: profit, bg: "bg-blue-100", text: "text-blue-800" }
        ].map((card, idx) => (
          <div key={idx} className={`p-6 rounded-lg shadow-md ${card.bg}`}>
            <h2 className="text-lg font-semibold">{card.label}</h2>
            <p className={`text-2xl font-bold ${card.text}`}>₹{card.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Monthly Report</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#00C49F" />
              <Bar dataKey="purchases" fill="#FFBB28" />
              <Bar dataKey="expenses" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Expense Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={expensePieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {expensePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
