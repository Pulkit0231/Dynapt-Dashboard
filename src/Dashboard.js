import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import './Dashboard.css'

function Dashboard() {
    const [grandTotal, setGrandTotal] = useState({});
    const [summary, setSummary] = useState({});
    const [regions, setRegions] = useState([]);
    const [regionTotals, setRegionTotals] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filteredRemarks, setFilteredRemarks] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://35.244.42.221:8090/api/v1/AdminDashboard/getMWDismantlingNonWorkableSummary', {
                    method: 'POST',
                    headers: {
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.9,en-GB;q=0.8',
                        'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbXBsb3llZUlkIjoicHRwIiwibmFtZSI6InB0cCIsInJvbGVzIjp7Il9pZCI6IjY2MmM4NTU4ZjE2MzQzODBlNWE4ZDE3MiIsIk5hbWUiOiJTdXBlciBBZG1pbiIsIklzQWN0aXZlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI0LTA0LTI3VDA0OjU1OjUyLjcwNloiLCJ1cGRhdGVkQXQiOiIyMDI0LTA1LTIwVDA2OjA3OjA0LjAwN1oiLCJfX3YiOjB9LCJ1c2VySWQiOiI2NjRiMGRlNTMxZjc4MDdlZGY3NWZjMjMiLCJGaW5hbmNpYWxZZWFyIjoiMjAyNC0yMDI1IiwiZGF0ZVRpbWUiOiIyMDI0LTA4LTEzVDA3OjA3OjMwLjg3MVoiLCJpYXQiOjE3MjM1MzI4NTAsImV4cCI6MTcyMzU3NjA1MH0.wDhSg-B5xT1ESWYtrMM8EdZRaNWHlVS1tm9J1z9AIk8',
                        'Connection': 'keep-alive',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        Circle: [],
                        projectId: "6631f4895fa692f3c319a740",
                        frmDate: "",
                        eDate: ""
                    })
                });

                const result = await response.json();
                if (result.grandTotal && result.summary) {
                    setGrandTotal(result.grandTotal);
                    setSummary(result.summary);
                    const uniqueRegions = new Set();
                    const totals = {};
                    Object.values(result.summary).forEach(regionData => {
                        Object.keys(regionData).forEach(region => {
                            uniqueRegions.add(region);
                            if (!totals[region]) {
                                totals[region] = 0;
                            }
                            totals[region] += regionData[region];
                        });
                    });
                    setRegions(Array.from(uniqueRegions));
                    setRegionTotals(totals);
                    setFilteredRemarks(Object.keys(result.summary));
                } else {
                    throw new Error("Unexpected data structure");
                }
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleRemarkFilterChange = (remark) => {
        setFilteredRemarks(prevRemarks =>
            prevRemarks.includes(remark)
                ? prevRemarks.filter(r => r !== remark)
                : [...prevRemarks, remark]
        );
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    // Prepare unpivoted data
    const unpivotedData = [];
    filteredRemarks.forEach(remark => {
        if (summary[remark]) {
            Object.entries(summary[remark]).forEach(([region, value]) => {
                unpivotedData.push({ remark, region, value });
            });
        }
    });

    //  Data for the bar chart
    const chartData = {
        labels: regions,
        datasets: filteredRemarks.map((remark, index) => ({
            label: remark,
            data: regions.map(region => summary[remark]?.[region] || 0),
            backgroundColor: `rgba(${(index * 50) % 255}, ${(index * 100) % 255}, ${(index * 150) % 255}, 0.5)`,
            borderColor: `rgba(${(index * 50) % 255}, ${(index * 100) % 255}, ${(index * 150) % 255}, 1)`,
            borderWidth: 1,
        }))
    };

    //  Data for the pie chart (total count by region)
    const pieChartData = {
        labels: regions,
        datasets: [
            {
                data: regions.map(region =>
                    filteredRemarks.reduce((sum, remark) => sum + (summary[remark]?.[region] || 0), 0)
                ),
                backgroundColor: regions.map((_, index) => `rgba(${(index * 50) % 255}, ${(index * 100) % 255}, ${(index * 150) % 255}, 0.5)`),
                borderColor: regions.map((_, index) => `rgba(${(index * 50) % 255}, ${(index * 100) % 255}, ${(index * 150) % 255}, 1)`),
                borderWidth: 1,
            }
        ]
    };


    return (
        <div>
            <div className='dashboard'>
                <div className='detailTable'>
                    <h1>MW Dismantling-Non-Workable Reason Summary</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Remark</th>
                                {regions.map((region, index) => (
                                    <th key={index}>{region}</th>
                                ))}
                                <th> Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(grandTotal).map((remark, index) => (
                                <tr key={index}>
                                    <td>{remark}</td>
                                    {regions.map((region, idx) => (
                                        <td key={idx}>{summary[remark]?.[region] || 0}</td>
                                    ))}
                                    <td>{grandTotal[remark]}</td>
                                </tr>
                            ))}
                            <tr>
                                <td><strong>Grant Total</strong></td>
                                {regions.map((region, index) => (
                                    <td key={index}><strong>{regionTotals[region] || 0}</strong></td>
                                ))}
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="dropdown">
                    <div className='dropdown-box'>
                        <h2>Filter by Remark</h2>
                        {Object.keys(summary).map((remark, index) => (
                            <div key={index}>
                                <input
                                    type="checkbox"
                                    id={`remark-${index}`}
                                    value={remark}
                                    checked={filteredRemarks.includes(remark)}
                                    onChange={() => handleRemarkFilterChange(remark)}
                                />
                                <label htmlFor={`remark-${index}`}>{remark}</label>
                            </div>
                        ))}
                    </div>
                </div>


                <div className='unpivot-table'>
                    <h2>Unpivot Table</h2>
                    <table className="unpivot-table">
                        <thead>
                            <tr>
                                <th>Remark</th>
                                <th>Attribute</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unpivotedData.map((data, index) => (
                                <tr key={index}>
                                    <td>{data.remark}</td>
                                    <td>{data.region}</td>
                                    <td>{data.value}</td>
                                </tr>
                            ))}
                            <tr>
                                <td><strong>Total</strong></td>
                                <td></td>
                                <td><strong>{unpivotedData.reduce((acc, data) => acc + data.value, 0)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className='chart'>
                <div className='barChart'>
                    <h1>Bar Chart</h1>
                    <Bar data={chartData} />
                </div>
                <div className='pieChart'>
                    <h1>Pie Chart</h1>
                    <Pie data={pieChartData} />
                </div>
            </div>


        </div>

    );
}

export default Dashboard;
