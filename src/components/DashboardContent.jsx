import React, { useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import "chart.js/auto";
import apiClient from "./apiClient";
import "../styles/dashboardcontent.css";

const Dashboard = () => {
  // State for daily, monthly, and annual stat card data,
  // monthly chart data, subregion chart data, and top agent details.
  const [dailySales, setDailySales] = useState(null);
  const [monthlySales, setMonthlySales] = useState(null);
  const [annualSales, setAnnualSales] = useState(null);
  const [monthlyChartData, setMonthlyChartData] = useState(null);
  const [subregionChartData, setSubregionChartData] = useState(null);
  const [topAgents, setTopAgents] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Daily sales from /sales/daily
        const dailyResponse = await apiClient.get("/sales/daily");
        let dailyTotal = 0;
        if (Array.isArray(dailyResponse.data)) {
          dailyTotal = dailyResponse.data.reduce(
            (sum, item) => sum + (item.totalAmount || 0),
            0
          );
        }
        setDailySales(dailyTotal);

        // Monthly stat card from /sales/monthly
        const monthlyResponse = await apiClient.get("/sales/monthly");
        let monthlyTotal = 0;
        if (Array.isArray(monthlyResponse.data)) {
          monthlyTotal = monthlyResponse.data.reduce(
            (sum, item) => sum + (item.totalAmount || 0),
            0
          );
        } else {
          monthlyTotal = monthlyResponse.data.monthlySales;
        }
        setMonthlySales(monthlyTotal);

        // Annual sales from /sales/annual
        const annualResponse = await apiClient.get("/sales/annual");
        let annualTotal = 0;
        if (Array.isArray(annualResponse.data)) {
          annualTotal = annualResponse.data.reduce(
            (sum, item) => sum + (item.totalAmount || 0),
            0
          );
        }
        setAnnualSales(annualTotal);

        // Monthly chart data from /sales/all-monthly
        const allMonthlyResponse = await apiClient.get("/sales/all-monthly");
        if (Array.isArray(allMonthlyResponse.data)) {
          const labels = allMonthlyResponse.data.map((item) =>
            new Date(item.salesMonth).toLocaleString("default", {
              month: "short",
            })
          );
          const dataPoints = allMonthlyResponse.data.map(
            (item) => item.totalAmount || 0
          );
          setMonthlyChartData({
            labels,
            datasets: [
              {
                label: "Monthly Sales (KES)",
                data: dataPoints,
                borderColor: "#2B9843",
                backgroundColor: "rgba(43,152,67,0.15)",
                fill: true,
                tension: 0.4,
              },
            ],
          });
        }

        // Subregion chart data from /sales/subregion
        const subregionResponse = await apiClient.get("/sales/subregion");
        if (Array.isArray(subregionResponse.data)) {
          const labels = subregionResponse.data.map((item) => item.sub_region);
          const dataPoints = subregionResponse.data.map(
            (item) => item.totalAmount || 0
          );
          setSubregionChartData({
            labels,
            datasets: [
              {
                label: "Sales per Area (KES)",
                data: dataPoints,
                backgroundColor: "#21B98F",
                borderRadius: 6,
              },
            ],
          });
        }

        // Agent details from /sales/agent
        const agentResponse = await apiClient.get("/sales/agent");
        // const agentsArray = agentResponse.data.map((item) => item.agent);
        // const sortedAgents = agentsArray.sort(
        //   (a, b) => (b.totalSales || 0) - (a.totalSales || 0)
        // );
        // const top5 = sortedAgents.slice(0, 5);
        // setTopAgents(top5);
        const agentsArray = agentResponse.data;
        const sortedAgents = agentsArray.sort(
          (a, b) => Number(b.sales) - Number(a.sales)
        );
        const top5 = sortedAgents.slice(0, 5);
        setTopAgents(top5);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    }
    fetchDashboardData();
  }, []);

  // Define stat cards using fetched data.
  const statCards = [
    {
      label: "Daily Sales",
      value:
        typeof dailySales === "number"
          ? `KES ${dailySales.toLocaleString()}`
          : "Loading...",
      change: "+5%",
    },
    {
      label: "Monthly Sales",
      value:
        typeof monthlySales === "number"
          ? `KES ${monthlySales.toLocaleString()}`
          : "Loading...",
      change: "+12%",
    },
    {
      label: "Annual Sales",
      value:
        typeof annualSales === "number"
          ? `KES ${annualSales.toLocaleString()}`
          : "Loading...",
      change: "+0%",
    },
    {
      label: "Yearly Growth",
      value: "28%",
      change: "+4%",
    },
  ];

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Monthly Sales Trend",
        color: "#444",
        font: { size: 16 },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#666" } },
      y: {
        grid: { color: "#eee" },
        ticks: {
          callback: (value) => `KES ${(value / 1000).toLocaleString()}k`,
          color: "#666",
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Sales per Area",
        color: "#444",
        font: { size: 16 },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#666" } },
      y: {
        grid: { color: "#eee" },
        ticks: {
          callback: (value) => `KES ${(value / 1000).toLocaleString()}k`,
          color: "#666",
        },
      },
    },
  };

  return (
    <div className="kenya-dashboard-container">
      <div className="welcome-section">
        <h1>Welcome Back!</h1>
        <p>Here’s your latest sales overview.</p>
      </div>
      <div className="stat-cards">
        {statCards.map((card, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-icon" />
            <div className="stat-info">
              <h3>{card.value}</h3>
              <p>{card.label}</p>
            </div>
            <span className="stat-change">{card.change}</span>
          </div>
        ))}
      </div>
      <div className="charts-row">
        <div className="chart-box">
          {monthlyChartData ? (
            <Line data={monthlyChartData} options={lineChartOptions} />
          ) : (
            <div>Loading monthly chart data...</div>
          )}
        </div>
        <div className="chart-box">
          {subregionChartData ? (
            <Bar data={subregionChartData} options={barChartOptions} />
          ) : (
            <div>Loading subregion data...</div>
          )}
        </div>
      </div>
      <div className="agents-table">
        <h2>Top Performing Agents</h2>
        <table>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Sales (KES)</th>
              <th>Commission</th>
              <th>Region</th>
            </tr>
          </thead>
          <tbody>
            {topAgents.map((agent, i) => (
              <tr key={i}>
                <td data-label="Agent">{agent.agentName}</td>
                <td data-label="Sales (KES)">
                  {/* {typeof agent.sales === "number"
                    ? agent.sales.toLocaleString()
                    : "0"} */}
                  {Number(agent.sales).toLocaleString()}
                </td>
                <td data-label="Commission">
                  {agent.commission !== undefined ? agent.commission : "0"}
                </td>
                <td data-label="Region">{agent.region || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
