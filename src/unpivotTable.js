import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
    const [grandTotal, setGrandTotal] = useState({});
    const [summary, setSummary] = useState({});
    const [regions, setRegions] = useState([]);
    const [filteredRemarks, setFilteredRemarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://35.244.42.221:8090/api/v1/AdminDashboard/getMWDismantlingNonWorkableSummary', {
                    method: 'POST',
                    headers: {
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.9,en-GB;q=0.8',
                        'Authorization': 'your-auth-token',
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

                    // Extract unique regions from the summary data
                    const uniqueRegions = new Set();
                    Object.values(result.summary).forEach(regionData => {
                        Object.keys(regionData).forEach(region => {
                            uniqueRegions.add(region);
                        });
                    });
                    setRegions(Array.from(uniqueRegions));

                    // Set initial filtered remarks
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

    return (
        <div>
            <h1>MW Dismantling-Non-Workable Reason Summary</h1>
            <div className="filter-section">
                <h2>Filter by Remark</h2>
                <div className="dropdown">
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
    );
}

export default Dashboard;
